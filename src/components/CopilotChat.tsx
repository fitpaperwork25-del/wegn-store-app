import { useState } from "react";
import { sendCopilotMessage, type CopilotMessage } from "../lib/copilot/copilotClient";

type CopilotChatProps = {
  visible: boolean;
  /** staffSession?.id ?? null - passed through to the orchestrator so it
   *  can resolve a real, server-verified role for non-owner sessions. */
  employeeId: string | null;
};

/**
 * Minimal Store Manager Copilot UI - Foundation Milestone 1. Enough to
 * exercise the full request flow end to end (authenticated user -> this
 * component -> orchestrator -> permission check -> search_products ->
 * tenant-scoped query -> model response -> audit log). No conversation
 * persistence beyond this component's own state - refreshing the page
 * starts a new conversation, per "do not add permanent conversation
 * memory in Phase 1."
 */
export function CopilotChat({ visible, employeeId }: CopilotChatProps) {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const priorMessages = messages;
    setMessages([...priorMessages, { role: "user", content: text }]);
    setInput("");
    setError("");
    setIsSending(true);

    const result = await sendCopilotMessage({ message: text, conversationId, employeeId, priorMessages });

    if ("error" in result) {
      setError(result.error);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: result.text }]);
    }
    setIsSending(false);
  }

  return (
    <div style={{ display: visible ? '' : 'none' }}>
      <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            minHeight: "200px", maxHeight: "420px", overflowY: "auto",
            border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px",
            display: "flex", flexDirection: "column", gap: "10px", background: "#f9fafb",
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Ask something like "search for cola" to get started.</div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: "10px",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#1d4ed8" : "#fff",
                color: m.role === "user" ? "#fff" : "#0f172a",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
              }}
            >
              {m.content}
            </div>
          ))}
          {isSending && <div style={{ color: "#94a3b8", fontSize: "13px" }}>Thinking…</div>}
        </div>

        {error && (
          <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Copilot…"
            disabled={isSending}
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            style={{
              padding: "10px 20px", fontWeight: "bold", borderRadius: "6px", border: "none",
              background: isSending || !input.trim() ? "#94a3b8" : "#1d4ed8", color: "#fff",
              cursor: isSending || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
