import { useState, type ReactNode } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import AIAssistantPlaceholder from "./components/AIAssistantPlaceholder";
import { useGuideProgress } from "./context/useGuideProgress";
import type { GuideSectionId } from "./data/navigation";
import type { GuideRoute } from "./hooks/useHashRoute";

interface GuideShellProps {
  route: GuideRoute;
  navigate: (route: GuideRoute) => void;
  children: ReactNode;
}

/**
 * Chrome only: top bar, sidebar, mobile drawer state, and the AI
 * placeholder FAB. What actually renders in the content area is
 * decided by the caller (GuideApp) and passed in as children — this
 * component doesn't know about pages, lessons, or content.
 */
export default function GuideShell({ route, navigate, children }: GuideShellProps) {
  const { theme, setLastSectionId } = useGuideProgress();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goToSection = (sectionId: GuideSectionId) => {
    setLastSectionId(sectionId);
    navigate({ sectionId, lessonId: null });
  };

  const goToLesson = (lessonId: string) => {
    navigate({ sectionId: route.sectionId, lessonId });
  };

  return (
    <div className="wegn-guide" data-guide-theme={theme} id="wegn-guide-root">
      <TopBar
        activeSection={route.sectionId}
        onSelectSection={goToSection}
        onSelectLesson={goToLesson}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className="wg-body">
        <Sidebar
          activeSection={route.sectionId}
          onNavigate={goToSection}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="wg-content">
          <div className="wg-content-inner">{children}</div>
        </main>
      </div>
      <AIAssistantPlaceholder />
    </div>
  );
}
