import LessonLayout from "../lesson/LessonLayout";
import { POS_LESSONS } from "../data/posLessons";
import type { GuideSectionId } from "../data/navigation";

interface PosLessonPageProps {
  lessonId: string;
  onBackToSection: () => void;
  onGoToSection: (sectionId: GuideSectionId) => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

/** Generic renderer for every WEGN Store Academy lesson in
 *  data/posLessons.ts — one component instead of one file per lesson,
 *  since they all share the same LessonLayout template. */
export default function PosLessonPage({ lessonId, onBackToSection, onGoToSection, onGoToLesson }: PosLessonPageProps) {
  const lesson = POS_LESSONS[lessonId];
  if (!lesson) return null;

  return (
    <LessonLayout
      lesson={lesson}
      sectionLabel="Getting Started"
      onBackToSection={onBackToSection}
      onGoToSection={onGoToSection}
      onGoToLesson={onGoToLesson}
    />
  );
}
