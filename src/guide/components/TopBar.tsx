import { useRef, useState } from "react";
import { GuideIcon } from "./icons";
import SearchBox from "./SearchBox";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import HelpPopover from "./HelpPopover";
import { useGuideProgress } from "../context/useGuideProgress";
import type { GuideSectionId } from "../data/navigation";

interface TopBarProps {
  activeSection: GuideSectionId;
  onSelectLesson: (lessonId: string) => void;
  onSelectSection: (sectionId: GuideSectionId) => void;
  onOpenSidebar: () => void;
}

export default function TopBar({ activeSection, onSelectLesson, onSelectSection, onOpenSidebar }: TopBarProps) {
  const { theme, toggleTheme } = useGuideProgress();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <header className="wg-topbar">
      <button
        type="button"
        className="wg-topbar-menu-btn"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <GuideIcon.menu />
      </button>

      <div className="wg-topbar-brand">
        <span className="wg-topbar-brand-mark" aria-hidden="true">W</span>
        <span>
          WEGN Store Guide
          <small>Interactive learning</small>
        </span>
      </div>

      <SearchBox
        ref={searchRef}
        onSelectLesson={onSelectLesson}
        onSelectSection={(id) => onSelectSection(id as GuideSectionId)}
      />

      <div className="wg-topbar-actions">
        <button
          type="button"
          className="wg-icon-btn"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
        >
          <GuideIcon.keyboard />
        </button>
        <button
          type="button"
          className="wg-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <GuideIcon.sun /> : <GuideIcon.moon />}
        </button>
        <HelpPopover sectionId={activeSection} />
      </div>

      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </header>
  );
}
