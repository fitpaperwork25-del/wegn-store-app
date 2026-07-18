import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { resolveRoleForRequest } from "../_shared/resolveRole.ts";
import { findTool, toAiToolDefinitions } from "../_shared/toolRegistry.ts";
import { AnthropicProvider } from "../_shared/anthropicProvider.ts";
import { writeAuditLog } from "../_shared/auditLog.ts";
import type { AiMessage, AiToolCallRequest } from "../_shared/aiProvider.ts";

/**
 * Store Manager Copilot orchestrator - Foundation Milestone 1.
 *
 * Request flow (matches the approved design): authenticated user -> this
 * function -> permission check -> search_products tool -> tenant-scoped
 * database query -> validated tool result -> model response -> audit-log
 * record.
 *
 * Unlike supabase/functions/process-invoice, every request here is
 * verified against the caller's real JWT before anything else happens -
 * there is no code path that reaches the model or a tool without a
 * resolved business_id and role.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Business Configuration (v1.2): tool outputs are unitless numbers - the
 * model is the one place that renders them as text, so it must be told
 * this store's currency explicitly rather than defaulting to USD/"$".
 * Never converts figures, only changes how the model should represent them.
 */
function buildSystemPrompt(currencyCode: string, currencySymbol: string): string {
  return `You are the Wegn Store Manager Copilot. You answer questions about a single store's data by calling the tools available to you - you never answer from general knowledge about "this store," only from what a tool returns.

This store's currency is ${currencyCode} (symbol: "${currencySymbol}"). Every dollar-shaped number returned by a tool is in this currency, not necessarily USD - always format monetary amounts using this store's currency symbol (e.g. "${currencySymbol}12.50"), never assume "$" unless that is actually this store's configured symbol.

Before answering, decide whether the question is about this store's live data (its products, stock, pricing, catalog, what it owes suppliers, its purchase orders, its sales/POS activity, what needs reordering, product cost/margin economics, or its cash drawer) or is conversational/educational (greetings, small talk, general inventory-management concepts, or questions about your own capabilities):
- If it is about this store's live data, you must call an appropriate tool before answering - never guess, estimate, or answer from general knowledge, even if the question sounds like it could be answered generally. This includes supplier accounts-payable questions (who is owed money, how much, unpaid/partial invoices, payment history), purchase order questions (status, supplier, contents, dollar amount), sales/POS questions (today's totals, cash/card split, top-selling products, cashier performance, returns/refunds, dormant or fast-moving products), low-stock/reorder questions, product cost/margin questions (cost, break-even, target price, current margin), and cash drawer questions (is it open, expected cash position, paid-outs) - always call the matching tool and report its exact totals rather than adding figures up yourself.
- If it is conversational or educational, answer directly in your own words and do not call a tool - a tool call is never needed to say hello, explain a general concept, or describe what you can do.

If a tool returns no results, say so plainly. If the information needed isn't available through any tool you have (including because it was withheld for the current user's role, or because no tool covers what's being asked, such as an exact total product count or exactly when a purchase order's status last changed), say so plainly rather than guessing or hinting at what the answer might be.`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !anthropicApiKey) {
    return jsonResponse({ error: "Server is not configured (missing required secrets)" }, 500);
  }

  let requestBody: { message?: string; conversationId?: string; employeeId?: string | null; priorMessages?: AiMessage[]; businessDayStartIso?: string };
  try {
    requestBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { message, conversationId, employeeId } = requestBody;
  if (typeof message !== "string" || message.trim().length === 0) {
    return jsonResponse({ error: "message is required" }, 400);
  }
  if (typeof conversationId !== "string" || conversationId.trim().length === 0) {
    return jsonResponse({ error: "conversationId is required" }, 400);
  }

  // 1. Authenticated user verification + tenant resolution.
  const verified = await verifyAuth({
    supabaseUrl,
    supabaseAnonKey,
    authorizationHeader: req.headers.get("Authorization"),
  });
  if (!verified) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  // 2. Full role-permission resolution - never a tenant-only fallback.
  const roleResult = await resolveRoleForRequest(verified.supabase, {
    businessId: verified.businessId,
    authUserId: verified.authUserId,
    requestedEmployeeId: typeof employeeId === "string" ? employeeId : null,
  });
  if (!roleResult.ok) {
    return jsonResponse({ error: `Not authorized (${roleResult.reason})` }, 403);
  }

  // The client (browser) knows the store's local business day; this server
  // has no timezone of its own, so "today"/"yesterday" tool answers must
  // use the client-supplied instant rather than the server's own clock.
  // Falls back to the server's own (potentially wrong-timezone) start of
  // day only if the client didn't supply a valid one.
  const clientBusinessDayStart = typeof requestBody.businessDayStartIso === "string" ? new Date(requestBody.businessDayStartIso) : null;
  const businessDayStartIso = clientBusinessDayStart && !isNaN(clientBusinessDayStart.getTime())
    ? clientBusinessDayStart.toISOString()
    : (() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); })();

  const ctx = { businessId: verified.businessId, role: roleResult.role, supabase: verified.supabase, businessDayStartIso };
  const provider = new AnthropicProvider(anthropicApiKey);

  // Business Configuration (v1.2): the model needs this store's real
  // currency to render tool output correctly - falls back to USD/"$" only
  // if the row can't be read, matching every other reporting surface's
  // fallback behavior rather than failing the whole request.
  const businessRes = await verified.supabase.from("businesses").select("currency_code, currency_symbol").eq("id", ctx.businessId).maybeSingle();
  const currencyCode = businessRes.data?.currency_code ?? "USD";
  const currencySymbol = businessRes.data?.currency_symbol ?? "$";

  const messages: AiMessage[] = [
    ...(Array.isArray(requestBody.priorMessages) ? requestBody.priorMessages : []),
    { role: "user", content: message },
  ];

  try {
    // 3-8. Tool invocation (permission-gated inside executeTool), model
    // response, audit logging - all driven by the provider's internal loop.
    const result = await provider.runConversation({
      systemPrompt: buildSystemPrompt(currencyCode, currencySymbol),
      messages,
      tools: toAiToolDefinitions(),
      executeTool: async (call: AiToolCallRequest) => {
        const tool = findTool(call.toolName);

        if (!tool) {
          await writeAuditLog(verified.supabase, {
            businessId: ctx.businessId,
            authUserId: verified.authUserId,
            resolvedRole: ctx.role,
            employeeId: roleResult.employeeId,
            conversationId,
            toolName: call.toolName,
            inputJson: call.input,
            status: "denied",
            errorMessage: "Unknown tool",
          });
          return { toolCallId: call.toolCallId, toolName: call.toolName, output: { error: "Unknown tool" } };
        }

        if (tool.allowedRoles && !tool.allowedRoles.includes(ctx.role)) {
          await writeAuditLog(verified.supabase, {
            businessId: ctx.businessId,
            authUserId: verified.authUserId,
            resolvedRole: ctx.role,
            employeeId: roleResult.employeeId,
            conversationId,
            toolName: call.toolName,
            inputJson: call.input,
            status: "denied",
            errorMessage: "Role not permitted to use this tool",
          });
          return { toolCallId: call.toolCallId, toolName: call.toolName, output: { error: "Not permitted for your role" } };
        }

        const execResult = await tool.execute(call.input, ctx);

        await writeAuditLog(verified.supabase, {
          businessId: ctx.businessId,
          authUserId: verified.authUserId,
          resolvedRole: ctx.role,
          employeeId: roleResult.employeeId,
          conversationId,
          toolName: call.toolName,
          inputJson: call.input,
          status: execResult.ok ? "success" : "error",
          errorMessage: execResult.ok ? undefined : execResult.error,
        });

        return {
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          output: execResult.ok ? execResult.value : { error: execResult.error },
        };
      },
    });

    return jsonResponse({ text: result.text });
  } catch (err) {
    console.error("[copilot-orchestrator] conversation failed:", err);
    return jsonResponse({ error: "The Copilot couldn't complete that request. Please try again." }, 502);
  }
});
