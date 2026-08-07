import { useState } from "react";
import { GuideIcon } from "./icons";
import type { GuideSectionId } from "../data/navigation";

// Context-sensitive in the literal sense required for a shell: the
// message changes with the current section. The copy itself is static
// per section (no logic/backend) - Phase 2+ can replace these strings
// with real per-lesson help without touching how the button works.
const HELP_COPY: Partial<Record<GuideSectionId, string>> = {
  home: "This is your starting point. Use the sidebar or search to jump to any topic.",
  "getting-started": "New here? Start with the first lesson below — it walks through your very first sale.",
  inventory: "Lessons here will cover adding products, stock alerts, and counting inventory.",
  "learning-progress": "This page tracks what you've completed across every section, stored on this device only.",
};

const DEFAULT_HELP = "Lessons for this section are coming in a future phase. Use Search to find what's available now.";

export default function HelpPopover({ sectionId }: { sectionId: GuideSectionId }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="wg-icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help for this page"
        aria-pressed={open}
      >
        <GuideIcon.help />
      </button>
      {open && (
        <div className="wg-ai-panel" style={{ position: "absolute", right: 0, bottom: "auto", top: "calc(100% + 8px)", width: 280 }}>
          <p className="wg-ai-panel-title">
            <GuideIcon.help /> Help
          </p>
          <p className="wg-ai-panel-body">{HELP_COPY[sectionId] ?? DEFAULT_HELP}</p>
        </div>
      )}
    </div>
  );
}
