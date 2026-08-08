import LessonLayout from "../lesson/LessonLayout";
import { POS_LESSONS } from "../data/posLessons";
import { SECTION_LESSONS } from "../data/sectionLessons";
import { ALL_LESSON_STUBS } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";

interface TaskLessonPageProps {
  lessonId: string;
  onGoToSection: (sectionId: GuideSectionId) => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

const STUB_BY_ID = new Map(ALL_LESSON_STUBS.map((l) => [l.id, l]));

/** Generic renderer for every task-based Academy lesson — the Getting
 *  Started / WEGN Store Academy sequence (data/posLessons.ts) and
 *  every other section's lessons (data/sectionLessons.ts). One
 *  component instead of one file per lesson, since they all share the
 *  same LessonLayout template; sectionLabel/back-navigation are
 *  resolved from the lesson's own section rather than assumed. */
export default function TaskLessonPage({ lessonId, onGoToSection, onGoToLesson }: TaskLessonPageProps) {
  const lesson = POS_LESSONS[lessonId] ?? SECTION_LESSONS[lessonId];
  if (!lesson) return null;

  const stub = STUB_BY_ID.get(lessonId);
  const sectionId = stub?.sectionId ?? lesson.sectionId as GuideSectionId;
  const sectionLabel = stub?.sectionLabel ?? "Getting Started";

  return (
    <LessonLayout
      lesson={lesson}
      sectionLabel={sectionLabel}
      onBackToSection={() => onGoToSection(sectionId)}
      onGoToSection={onGoToSection}
      onGoToLesson={onGoToLesson}
    />
  );
}
