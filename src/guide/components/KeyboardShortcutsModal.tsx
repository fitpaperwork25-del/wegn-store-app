import { GuideIcon } from "./icons";

const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: "/", description: "Focus search" },
  { keys: "?", description: "Show this shortcuts panel" },
  { keys: "Esc", description: "Close a panel or modal" },
  { keys: "G then H", description: "Go to Home (Phase 2)" },
];

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="wg-modal-backdrop" onClick={onClose}>
      <div
        className="wg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wg-shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wg-modal-header">
          <h2 className="wg-modal-title" id="wg-shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="wg-icon-btn" onClick={onClose} aria-label="Close">
            <GuideIcon.close />
          </button>
        </div>
        {SHORTCUTS.map((s) => (
          <div className="wg-shortcut-row" key={s.keys}>
            <span>{s.description}</span>
            <span className="wg-kbd">{s.keys}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
