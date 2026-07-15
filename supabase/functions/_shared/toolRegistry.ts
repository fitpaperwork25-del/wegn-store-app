import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AiToolDefinition, JsonSchema } from "./aiProvider.ts";
import type { CopilotRole } from "./resolveRole.ts";
import { searchProducts, createSupabaseProductSearchExecutor } from "./tools/searchProducts.ts";
import { getSupplierBalances, fetchSupplierBalancesRawData } from "./tools/getSupplierBalances.ts";
import { getSupplierPaymentHistory, fetchSupplierPaymentHistoryRawData } from "./tools/getSupplierPaymentHistory.ts";

/**
 * Controlled tool registry. Adding a tool means adding one entry here - it
 * never means changing the orchestrator's auth/role/audit plumbing.
 */

export type ToolExecutionContext = {
  businessId: string;
  role: CopilotRole;
  supabase: SupabaseClient;
};

export type ToolRegistryEntry = {
  name: string;
  mode: "read" | "write";
  description: string;
  inputSchema: JsonSchema;
  /** Roles permitted to call this tool at all. Undefined means every
   *  Copilot-eligible role. Field-level restrictions (e.g. cost/margin)
   *  are handled inside the tool's own handler, not here - this is the
   *  coarse "can this role use this tool at all" gate. */
  allowedRoles?: CopilotRole[];
  execute: (rawInput: unknown, ctx: ToolExecutionContext) => Promise<{ ok: true; value: unknown } | { ok: false; error: string }>;
};

const SEARCH_PRODUCTS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Product name, SKU, or barcode text to search for." },
    limit: { type: "integer", minimum: 1, maximum: 25, description: "Maximum results to return (default 10)." },
  },
  required: ["query"],
  additionalProperties: false,
};

const GET_SUPPLIER_BALANCES_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string", description: "Optional supplier name (or partial name) to filter to one supplier. Omit for all suppliers." },
    statusFilter: {
      type: "string",
      enum: ["unpaid", "partial", "paid", "all"],
      description: "Optional. Defaults to 'all'. Use 'unpaid' for fully-outstanding invoices, 'partial' for partially paid ones.",
    },
  },
  required: [],
  additionalProperties: false,
};

const GET_SUPPLIER_PAYMENT_HISTORY_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string", description: "Optional supplier name (or partial name). Omit for the most recent payments across all suppliers." },
    limit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum payments to return, most recent first (default 10)." },
  },
  required: [],
  additionalProperties: false,
};

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    name: "search_products",
    mode: "read",
    description:
      "Search the store's live product catalog by name, SKU, or barcode. Returns basic product and stock info (name, SKU, barcode, selling price, quantity on hand, status) for matching products - no cost, margin, or profit data. " +
      "Use this whenever the user asks about specific products, current stock/inventory levels, or pricing for this store - for example: \"What products are in stock?\", \"Do we have Sunflower Seeds?\", \"How much is SKU 00123?\", \"Search for barcode 012345678901\", \"What's our stock of oat milk?\". " +
      "Do not use this for questions that aren't about this store's actual catalog data - general/educational questions (e.g. \"Explain FIFO inventory\"), greetings or small talk (e.g. \"Hello\", \"What can you do?\"), or requests this tool cannot fulfill (it searches by name/SKU/barcode text and does not return a total product count, cost/margin data, sales history, or supplier/employee/customer data).",
    inputSchema: SEARCH_PRODUCTS_INPUT_SCHEMA,
    // No allowedRoles restriction - every Copilot-eligible role may search
    // products; the output itself never contains restricted fields.
    execute: async (rawInput, ctx) => {
      const executor = createSupabaseProductSearchExecutor(ctx.supabase);
      const result = await searchProducts(rawInput, { businessId: ctx.businessId }, executor);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_supplier_balances",
    mode: "read",
    description:
      "Look up what this store owes its suppliers: outstanding, partially paid, and fully paid invoice balances, either across all suppliers or for one named supplier. Returns exact, already-computed totals - never estimate or add up figures yourself. " +
      "Use this for questions like: \"Which suppliers do we owe money?\", \"How much do we owe in total?\", \"How much do we owe CBA Supplies?\", \"Show unpaid supplier invoices\", \"Show partially paid invoices\", \"Which suppliers have no outstanding balance?\". " +
      "Do not use this for payment history/transactions (use get_supplier_payment_history instead) or for anything about products/inventory (use search_products instead). This tool is read-only and cannot create, edit, approve, delete, or pay invoices.",
    inputSchema: GET_SUPPLIER_BALANCES_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getSupplierBalances(rawInput, { businessId: ctx.businessId }, (businessId) => fetchSupplierBalancesRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_supplier_payment_history",
    mode: "read",
    description:
      "Look up this store's history of payments made to suppliers - individual payment records (amount, date, method, reference), most recent first, either across all suppliers or for one named supplier. " +
      "Use this for questions like: \"What was our latest supplier payment?\", \"Show payment history for CBA Supplies\". " +
      "Do not use this for current balances or what's still owed (use get_supplier_balances instead). This tool is read-only and cannot create, edit, or delete payments.",
    inputSchema: GET_SUPPLIER_PAYMENT_HISTORY_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getSupplierPaymentHistory(rawInput, { businessId: ctx.businessId }, (businessId) => fetchSupplierPaymentHistoryRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
];

export function findTool(name: string): ToolRegistryEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}

export function toAiToolDefinitions(): AiToolDefinition[] {
  return TOOL_REGISTRY.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
