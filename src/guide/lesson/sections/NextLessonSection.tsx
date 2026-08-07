import { GuideIcon } from "../../components/icons";
import type { LessonContent } from "../types";

interface NextLessonSectionProps {
  nextLesson: LessonContent["nextLesson"];
  onGoToNext: (sectionId: string, lessonId: string | null) => void;
}

export default function NextLessonSection({ nextLesson, onGoToNext }: NextLessonSectionProps) {
  return (
    <section id="wg-section-next" className="wg-lesson-section" style={{ marginBottom: 0 }}>
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">6</span>
        <h2 className="wg-lesson-section-title">Next Lesson</h2>
      </div>
      {nextLesson ? (
        <button
          type="button"
          className="wg-next-lesson"
          style={{ width: "100%", border: "none" }}
          onClick={() => onGoToNext(nextLesson.sectionId, nextLesson.lessonId)}
        >
          <span>
            <span className="wg-next-lesson-label">Up next</span>
            <span className="wg-next-lesson-title">{nextLesson.title}</span>
          </span>
          <GuideIcon.chevronRight />
        </button>
      ) : (
        <div className="wg-empty">
          <div className="wg-empty-icon">
            <GuideIcon.trophy />
          </div>
          <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>More lessons are on the way</p>
          <p className="wg-card-body">This is the last lesson available right now — check back soon.</p>
        </div>
      )}
    </section>
  );
}
