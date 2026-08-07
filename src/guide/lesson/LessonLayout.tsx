import { GuideIcon } from "../components/icons";
import { useGuideProgress } from "../context/useGuideProgress";
import type { GuideSectionId } from "../data/navigation";
import OverviewSection from "./sections/OverviewSection";
import WalkthroughSection from "./sections/WalkthroughSection";
import PracticeSection from "./sections/PracticeSection";
import TipsSection from "./sections/TipsSection";
import KnowledgeCheckSection from "./sections/KnowledgeCheckSection";
import NextLessonSection from "./sections/NextLessonSection";
import type { LessonContent } from "./types";

const JUMP_LINKS: Array<{ id: string; label: string }> = [
  { id: "wg-section-overview", label: "Overview" },
  { id: "wg-section-walkthrough", label: "Walkthrough" },
  { id: "wg-section-practice", label: "Practice" },
  { id: "wg-section-tips", label: "Tips" },
  { id: "wg-section-quiz", label: "Knowledge Check" },
  { id: "wg-section-next", label: "Next" },
];

interface LessonLayoutProps {
  lesson: LessonContent;
  sectionLabel: string;
  onBackToSection: () => void;
  onGoToSection: (sectionId: GuideSectionId) => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

/**
 * The reusable template every lesson renders through. A lesson is
 * just a LessonContent value (see ./types) — this component and its
 * six section components are the only thing that knows how to turn
 * that data into the six required parts: Overview, Interactive
 * Walkthrough, Practice, Tips, Knowledge Check, Next Lesson.
 */
export default function LessonLayout({ lesson, sectionLabel, onBackToSection, onGoToSection, onGoToLesson }: LessonLayoutProps) {
  const { isLessonComplete, markLessonComplete, markLessonIncomplete, isBookmarked, toggleBookmark } = useGuideProgress();
  const complete = isLessonComplete(lesson.id);
  const bookmarked = isBookmarked(lesson.id);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div className="wg-breadcrumb">
        <button type="button" onClick={onBackToSection}>{sectionLabel}</button>
        <GuideIcon.chevronRight />
        <span>{lesson.title}</span>
      </div>

      <span className="wg-eyebrow">Lesson · {lesson.minutes} min</span>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <h1 className="wg-page-title">{lesson.title}</h1>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4 }}>
          <button
            type="button"
            className="wg-icon-btn"
            aria-pressed={bookmarked}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
            onClick={() => toggleBookmark(lesson.id)}
          >
            <GuideIcon.bookmark />
          </button>
          <button
            type="button"
            className={complete ? "wg-btn wg-btn-secondary" : "wg-btn wg-btn-primary"}
            onClick={() => (complete ? markLessonIncomplete(lesson.id) : markLessonComplete(lesson.id))}
          >
            <GuideIcon.check />
            {complete ? "Completed" : "Mark as complete"}
          </button>
        </div>
      </div>

      <nav className="wg-lesson-nav" aria-label="Jump to section">
        {JUMP_LINKS.map((l) => (
          <button key={l.id} type="button" className="wg-lesson-nav-item" onClick={() => scrollTo(l.id)}>
            {l.label}
          </button>
        ))}
      </nav>

      <OverviewSection overview={lesson.overview} />
      <WalkthroughSection walkthrough={lesson.walkthrough} />
      <PracticeSection practice={lesson.practice} />
      <TipsSection tips={lesson.tips} />
      <KnowledgeCheckSection quiz={lesson.quiz} />
      <NextLessonSection
        nextLesson={lesson.nextLesson}
        onGoToNext={(sectionId, lessonId) => {
          if (lessonId) onGoToLesson(sectionId as GuideSectionId, lessonId);
          else onGoToSection(sectionId as GuideSectionId);
        }}
      />
    </div>
  );
}
