import QuizList from "../QuizList";
import type { LessonQuizQuestion } from "../types";

interface KnowledgeCheckScreenProps {
  quiz: LessonQuizQuestion[];
  onAllAnswered: () => void;
}

export default function KnowledgeCheckScreen({ quiz, onAllAnswered }: KnowledgeCheckScreenProps) {
  return (
    <div className="wg-ob-screen">
      <p className="wg-ob-intro">Quick check — five questions, no pressure.</p>
      <QuizList quiz={quiz} onAllAnswered={onAllAnswered} />
    </div>
  );
}
