import { GUIDE_NAV } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "./icons";
import { useGuideProgress } from "../context/useGuideProgress";

interface SidebarProps {
  activeSection: GuideSectionId;
  onNavigate: (id: GuideSectionId) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onNavigate, open, onClose }: SidebarProps) {
  const { completedLessonIds } = useGuideProgress();

  return (
    <>
      {open && <div className="wg-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <nav className="wg-sidebar" data-open={open} aria-label="Guide sections">
        <div className="wg-nav-group">
          {GUIDE_NAV.map((item) => {
            const Icon = GuideIcon[item.icon as keyof typeof GuideIcon];
            const total = item.plannedLessons?.length ?? 0;
            const done = item.plannedLessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                className="wg-nav-item"
                aria-current={activeSection === item.id ? "page" : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              >
                {Icon ? <Icon /> : null}
                <span>{item.label}</span>
                {total > 0 && (
                  <span className="wg-nav-item-progress">
                    {done}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
