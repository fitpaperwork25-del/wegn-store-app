import QuizList from "../QuizList";
import type { LessonContent } from "../types";

export default function KnowledgeCheckSection({ quiz }: { quiz: LessonContent["quiz"] }) {
  return (
    <section id="wg-section-quiz" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">5</span>
        <h2 className="wg-lesson-section-title">Knowledge Check</h2>
      </div>
      <QuizList quiz={quiz} />
    </section>
  );
}
