import { GUIDE_NAV, SAMPLE_LESSON_ID } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "../components/icons";
import { useGuideProgress } from "../context/useGuideProgress";

interface SectionPageProps {
  sectionId: GuideSectionId;
  onOpenLesson: (lessonId: string) => void;
}

/**
 * Generic landing page for a nav section. Renders its planned-lesson
 * list (one row per lesson) if it has one, and an empty state if not.
 * Only the sample lesson is actually clickable in Phase 1 — everything
 * else is a real, labeled "coming soon" row rather than a fake link.
 */
export default function SectionPage({ sectionId, onOpenLesson }: SectionPageProps) {
  const item = GUIDE_NAV.find((n) => n.id === sectionId);
  const { isLessonComplete } = useGuideProgress();
  const lessons = item?.plannedLessons ?? [];

  if (!item) return null;

  const Icon = GuideIcon[item.icon as keyof typeof GuideIcon];

  return (
    <div>
      <span className="wg-eyebrow">Guide section</span>
      <h1 className="wg-page-title">{item.label}</h1>
      <p className="wg-page-subtitle">
        {lessons.length > 0
          ? `${lessons.length} lesson${lessons.length === 1 ? "" : "s"} planned for this section.`
          : "Lessons for this section haven't been built yet."}
      </p>

      {lessons.length === 0 && (
        <div className="wg-empty">
          <div className="wg-empty-icon">{Icon ? <Icon /> : null}</div>
          <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>Coming in a future phase</p>
          <p className="wg-card-body">This section is part of the plan but has no lessons built yet.</p>
        </div>
      )}

      {lessons.map((lesson) => {
        const isSample = lesson.id === SAMPLE_LESSON_ID;
        const done = isLessonComplete(lesson.id);
        const row = (
          <>
            <span className="wg-lesson-row-check" data-done={done}>
              <GuideIcon.check />
            </span>
            <span className="wg-lesson-row-title">{lesson.title}</span>
            <span className="wg-lesson-row-meta">{lesson.minutes} min</span>
            {isSample ? <GuideIcon.chevronRight /> : <span className="wg-badge wg-badge-soon">Coming soon</span>}
          </>
        );
        return isSample ? (
          <button
            key={lesson.id}
            type="button"
            className="wg-lesson-row"
            style={{ width: "100%", border: "1px solid var(--g-line)", cursor: "pointer" }}
            onClick={() => onOpenLesson(lesson.id)}
          >
            {row}
          </button>
        ) : (
          <div key={lesson.id} className="wg-lesson-row" aria-disabled="true">
            {row}
          </div>
        );
      })}
    </div>
  );
}
