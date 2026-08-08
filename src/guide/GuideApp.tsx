import type { ReactNode } from "react";
import "./guide.css";
import { GuideProgressProvider } from "./context/GuideProgressContext";
import { useGuideProgress } from "./context/useGuideProgress";
import { useHashRoute } from "./hooks/useHashRoute";
import GuideShell from "./GuideShell";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import SectionPage from "./pages/SectionPage";
import SampleLessonPage from "./pages/SampleLessonPage";
import WelcomeLessonPage from "./pages/WelcomeLessonPage";
import TaskLessonPage from "./pages/TaskLessonPage";
import LearningProgressPage from "./pages/LearningProgressPage";
import LearningPathsPage from "./pages/LearningPathsPage";
import AchievementsPage from "./pages/AchievementsPage";
import CertificateView from "./pages/CertificateView";
import RoleSelector from "./components/RoleSelector";
import { IMPLEMENTED_LESSON_IDS } from "./data/navigation";
import { POS_LESSONS } from "./data/posLessons";
import { SECTION_LESSONS } from "./data/sectionLessons";
import type { GuideSectionId } from "./data/navigation";

function GuideRoutes() {
  const [route, navigate] = useHashRoute();
  const { setLastSectionId, isLessonUnlocked, userRole, theme } = useGuideProgress();

  // First-ever visit: ask what the person's role is before showing
  // anything else. Answering (or skipping) sets userRole and this
  // never shows again.
  if (userRole === null) {
    return (
      <div className="wegn-guide" data-guide-theme={theme} id="wegn-guide-root">
        <RoleSelector onDone={() => {}} />
      </div>
    );
  }

  const goToSection = (sectionId: GuideSectionId) => {
    setLastSectionId(sectionId);
    navigate({ sectionId, lessonId: null });
  };
  const openLesson = (lessonId: string) => navigate({ sectionId: "getting-started", lessonId });
  const goToLesson = (sectionId: GuideSectionId, lessonId: string | null) =>
    lessonId ? navigate({ sectionId, lessonId }) : goToSection(sectionId);

  let page: ReactNode;

  if (route.certificatePathId) {
    page = <CertificateView pathId={route.certificatePathId} onBack={() => goToSection("learning-paths")} />;
  } else if (route.lessonId) {
    const lessonId = route.lessonId;
    const isReal = IMPLEMENTED_LESSON_IDS.has(lessonId);
    const isUnlocked = isLessonUnlocked(lessonId);

    // A stub id, or a real lesson the user hasn't unlocked yet, both
    // fall back to the section page instead of 404ing or letting
    // someone skip ahead via a direct link.
    if (!isReal || !isUnlocked) {
      page = <SectionPage sectionId={route.sectionId} onOpenLesson={openLesson} />;
    } else if (lessonId === "welcome-to-wegn-store") {
      page = (
        <WelcomeLessonPage onBackToSection={() => goToSection("getting-started")} onGoToLesson={goToLesson} />
      );
    } else if (lessonId === "sample-first-sale") {
      page = (
        <SampleLessonPage
          onBackToSection={() => goToSection("getting-started")}
          onGoToSection={goToSection}
          onGoToLesson={goToLesson}
        />
      );
    } else if (lessonId in POS_LESSONS || lessonId in SECTION_LESSONS) {
      page = <TaskLessonPage lessonId={lessonId} onGoToSection={goToSection} onGoToLesson={goToLesson} />;
    } else {
      page = <SectionPage sectionId={route.sectionId} onOpenLesson={openLesson} />;
    }
  } else {
    switch (route.sectionId) {
      case "home":
        page = <HomePage onGoToSection={goToSection} onOpenLesson={openLesson} />;
        break;
      case "search":
        page = <SearchPage onGoToSection={goToSection} onOpenLesson={openLesson} />;
        break;
      case "learning-progress":
        page = (
          <LearningProgressPage
            onOpenLesson={openLesson}
            onGoToSection={goToSection}
            onViewCertificate={(pathId) => navigate({ sectionId: "learning-paths", lessonId: null, certificatePathId: pathId })}
          />
        );
        break;
      case "learning-paths":
        page = (
          <LearningPathsPage
            onViewCertificate={(pathId) => navigate({ sectionId: "learning-paths", lessonId: null, certificatePathId: pathId })}
          />
        );
        break;
      case "achievements":
        page = <AchievementsPage />;
        break;
      default:
        page = <SectionPage sectionId={route.sectionId} onOpenLesson={openLesson} />;
    }
  }

  return (
    <GuideShell route={route} navigate={navigate}>
      {page}
    </GuideShell>
  );
}

/** Entry point for the WEGN Store Interactive Guide module. Mount this
 *  anywhere — it owns its own routing (URL hash) and state (localStorage)
 *  and doesn't read or write anything from the host app. */
export default function GuideApp() {
  return (
    <GuideProgressProvider>
      <GuideRoutes />
    </GuideProgressProvider>
  );
}
