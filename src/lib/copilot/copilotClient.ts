import { supabase } from "../../supabase";

/**
 * Thin client for the copilot-orchestrator Edge Function. Matches the
 * existing supabase.functions.invoke("process-invoice", ...) pattern
 * already used in App.tsx - the Supabase client automatically forwards the
 * caller's session JWT, which is what the orchestrator verifies server-side
 * before doing anything else.
 */

export type CopilotMessage = { role: "user" | "assistant"; content: string };

export async function sendCopilotMessage(params: {
  message: string;
  conversationId: string;
  employeeId: string | null;
  priorMessages: CopilotMessage[];
}): Promise<{ text: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke("copilot-orchestrator", {
    body: {
      message: params.message,
      conversationId: params.conversationId,
      employeeId: params.employeeId,
      priorMessages: params.priorMessages,
    },
  });

  if (error) return { error: `Copilot request failed: ${error.message}` };
  if (data?.error) return { error: data.error as string };
  return { text: data?.text as string };
}
