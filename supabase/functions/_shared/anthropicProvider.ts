import type { AiProvider, AiMessage, AiToolDefinition, AiToolCallRequest, AiConversationResult } from "./aiProvider.ts";

/**
 * Anthropic (Claude) adapter for the provider-neutral AiProvider interface.
 * Selected for this milestone because it's the only AI provider with any
 * existing integration in this codebase (supabase/functions/process-invoice
 * already uses ANTHROPIC_API_KEY against the same Messages API) - reusing
 * it means no new vendor relationship, no new secret to provision, and a
 * proven integration pattern. See the design freeze report for the full
 * reasoning; this file is the only place that knows Anthropic's specific
 * request/response shape.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 4; // hard cap - a single-tool milestone should never need many round-trips

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = { role: "user" | "assistant"; content: string | AnthropicContentBlock[] };

export class AnthropicProvider implements AiProvider {
  constructor(private readonly apiKey: string) {}

  async runConversation(input: {
    systemPrompt: string;
    messages: AiMessage[];
    tools: AiToolDefinition[];
    executeTool: (call: AiToolCallRequest) => Promise<{ toolCallId: string; toolName: string; output: unknown }>;
  }): Promise<AiConversationResult> {
    const messages: AnthropicMessage[] = input.messages.map((m) => ({ role: m.role, content: m.content }));
    const anthropicTools = input.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));

    const allToolCalls: AiToolCallRequest[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // Force the tool on the opening turn only - a single-tool milestone
      // has no ambiguity about which tool to force, but forcing it on every
      // round would prevent the model from ever returning a final text
      // answer after the tool result comes back, looping until
      // MAX_TOOL_ROUNDS is exhausted.
      const toolChoice = round === 0 && anthropicTools.length === 1
        ? { type: "tool" as const, name: anthropicTools[0].name }
        : undefined;

      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: input.systemPrompt,
          messages,
          tools: anthropicTools,
          ...(toolChoice ? { tool_choice: toolChoice } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = (err as { error?: { message?: string } }).error?.message ?? res.statusText;
        throw new Error(`Anthropic API error: ${message}`);
      }

      const body = await res.json() as { content: AnthropicContentBlock[]; stop_reason: string };
      const toolUseBlocks = body.content.filter((b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use");
      const textBlocks = body.content.filter((b): b is Extract<AnthropicContentBlock, { type: "text" }> => b.type === "text");

      if (toolUseBlocks.length === 0) {
        return { text: textBlocks.map((b) => b.text).join("\n").trim(), toolCalls: allToolCalls };
      }

      // Model wants to call tools: append its request as an assistant turn,
      // execute each call, and feed the results back as a user turn with
      // tool_result blocks - the standard Anthropic tool-use round-trip.
      messages.push({ role: "assistant", content: body.content });

      const resultBlocks: AnthropicContentBlock[] = [];
      for (const call of toolUseBlocks) {
        const request: AiToolCallRequest = { toolCallId: call.id, toolName: call.name, input: call.input };
        allToolCalls.push(request);
        const result = await input.executeTool(request);
        resultBlocks.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: JSON.stringify(result.output),
        });
      }
      messages.push({ role: "user", content: resultBlocks });
    }

    throw new Error(`Anthropic conversation exceeded ${MAX_TOOL_ROUNDS} tool-call rounds without a final answer`);
  }
}
