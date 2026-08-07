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
import LearningProgressPage from "./pages/LearningProgressPage";
import { SAMPLE_LESSON_ID } from "./data/navigation";
import type { GuideSectionId } from "./data/navigation";

function GuideRoutes() {
  const [route, navigate] = useHashRoute();
  const { setLastSectionId } = useGuideProgress();

  const goToSection = (sectionId: GuideSectionId) => {
    setLastSectionId(sectionId);
    navigate({ sectionId, lessonId: null });
  };
  const openLesson = (lessonId: string) => navigate({ sectionId: "getting-started", lessonId });
  const goToLesson = (sectionId: GuideSectionId, lessonId: string | null) =>
    lessonId ? navigate({ sectionId, lessonId }) : goToSection(sectionId);

  let page: ReactNode;

  if (route.lessonId) {
    // Phase 1 has exactly one real lesson. Any other lesson id (all
    // still stubs) falls back to its section page rather than 404ing.
    page =
      route.lessonId === SAMPLE_LESSON_ID ? (
        <SampleLessonPage
          onBackToSection={() => goToSection("getting-started")}
          onGoToSection={goToSection}
          onGoToLesson={goToLesson}
        />
      ) : (
        <SectionPage sectionId={route.sectionId} onOpenLesson={openLesson} />
      );
  } else {
    switch (route.sectionId) {
      case "home":
        page = <HomePage onGoToSection={goToSection} onOpenLesson={openLesson} />;
        break;
      case "search":
        page = <SearchPage onGoToSection={goToSection} onOpenLesson={openLesson} />;
        break;
      case "learning-progress":
        page = <LearningProgressPage onOpenLesson={openLesson} onGoToSection={goToSection} />;
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
