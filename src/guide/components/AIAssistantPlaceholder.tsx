import { useState } from "react";
import { GuideIcon } from "./icons";

/**
 * Explicit placeholder per spec ("AI-powered assistant (placeholder
 * only)") — no model call, no API route, nothing wired up. Exists so
 * the shell has the real UI affordance in place for Phase 2+ to fill
 * in, rather than the feature simply not existing yet.
 */
export default function AIAssistantPlaceholder() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="wg-ai-panel" role="dialog" aria-label="AI Assistant">
          <p className="wg-ai-panel-title">
            <GuideIcon.spark /> AI Assistant
          </p>
          <p className="wg-ai-panel-body">
            Coming soon. This will answer questions about WEGN Store in plain language, right where you're working.
            Not connected to anything yet — this is a placeholder for Phase 2+.
          </p>
        </div>
      )}
      <button
        type="button"
        className="wg-ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Assistant (placeholder)"
        aria-pressed={open}
      >
        <GuideIcon.spark />
      </button>
    </>
  );
}
