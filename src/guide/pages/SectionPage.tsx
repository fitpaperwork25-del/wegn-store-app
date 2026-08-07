import { ALL_LESSON_STUBS, GUIDE_NAV, IMPLEMENTED_LESSON_IDS } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "../components/icons";
import { useGuideProgress } from "../context/useGuideProgress";

interface SectionPageProps {
  sectionId: GuideSectionId;
  onOpenLesson: (lessonId: string) => void;
}

const LESSON_TITLE_BY_ID = new Map(ALL_LESSON_STUBS.map((l) => [l.id, l.title]));

/**
 * Generic landing page for a nav section. Renders its planned-lesson
 * list (one row per lesson) if it has one, and an empty state if not.
 * A lesson row is one of three states: clickable (implemented +
 * unlocked), locked (implemented but its prerequisite isn't done
 * yet), or a plain "coming soon" label (not built yet).
 */
export default function SectionPage({ sectionId, onOpenLesson }: SectionPageProps) {
  const item = GUIDE_NAV.find((n) => n.id === sectionId);
  const { isLessonComplete, isLessonUnlocked } = useGuideProgress();
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
        const isReal = IMPLEMENTED_LESSON_IDS.has(lesson.id);
        const unlocked = isLessonUnlocked(lesson.id);
        const clickable = isReal && unlocked;
        const done = isLessonComplete(lesson.id);
        const prereqTitle = lesson.prerequisiteLessonId ? LESSON_TITLE_BY_ID.get(lesson.prerequisiteLessonId) : undefined;

        const row = (
          <>
            <span className="wg-lesson-row-check" data-done={done}>
              {isReal && !unlocked ? <GuideIcon.bookmark /> : <GuideIcon.check />}
            </span>
            <span className="wg-lesson-row-title">
              {lesson.title}
              {isReal && !unlocked && prereqTitle && (
                <span className="wg-lesson-row-sub">Complete "{prereqTitle}" first</span>
              )}
            </span>
            <span className="wg-lesson-row-meta">{lesson.minutes} min</span>
            {clickable ? (
              <GuideIcon.chevronRight />
            ) : isReal ? (
              <span className="wg-badge">Locked</span>
            ) : (
              <span className="wg-badge wg-badge-soon">Coming soon</span>
            )}
          </>
        );
        return clickable ? (
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
