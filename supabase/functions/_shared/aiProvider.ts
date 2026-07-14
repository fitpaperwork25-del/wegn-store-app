/**
 * Provider-neutral AI interface. The orchestrator and tool registry are
 * written against this shape only - no Anthropic- or OpenAI-specific
 * request/response format (message content blocks, tool_use/tool_result
 * framing, etc.) is ever referenced outside of the one adapter file that
 * implements this interface for a given provider (see
 * anthropicProvider.ts). Swapping or adding a provider later means writing
 * a new adapter against this same interface; it never touches
 * orchestration, tool, or authorization logic.
 *
 * Tool-call round-trip mechanics (the model asks for a tool, the caller
 * runs it, the model is given the result and continues) are handled
 * entirely inside the adapter via the `executeTool` callback - callers of
 * this interface never see an intermediate "the model wants to call a
 * tool" state, only the final answer plus a record of what was called.
 */

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

/** JSON Schema, loosely typed - deliberately not importing a JSON Schema
 *  library for a single-tool milestone. */
export type JsonSchema = Record<string, unknown>;

export type AiToolDefinition = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
};

export type AiToolCallRequest = {
  toolCallId: string;
  toolName: string;
  input: unknown;
};

export type AiToolResult = {
  toolCallId: string;
  toolName: string;
  /** JSON-serializable output, or an error description if the tool call failed. */
  output: unknown;
};

export type AiConversationResult = {
  text: string;
  /** Every tool call made during this conversation, in order - for the
   *  orchestrator's own bookkeeping. Audit-log writes happen inside
   *  executeTool itself (see toolRegistry.ts), not here, so a tool call is
   *  logged exactly once regardless of how the provider structures its
   *  internal round-trips. */
  toolCalls: AiToolCallRequest[];
};

export interface AiProvider {
  runConversation(input: {
    systemPrompt: string;
    messages: AiMessage[];
    tools: AiToolDefinition[];
    executeTool: (call: AiToolCallRequest) => Promise<AiToolResult>;
  }): Promise<AiConversationResult>;
}
