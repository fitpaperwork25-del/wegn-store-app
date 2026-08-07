import { useEffect, useState } from "react";
import type { LessonQuizQuestion } from "./types";

function QuizQuestion({
  question,
  index,
  onAnswered,
}: {
  question: LessonQuizQuestion;
  index: number;
  onAnswered: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = answered && question.options[selected].correct;

  return (
    <div className="wg-card" style={{ marginTop: index > 0 ? 12 : 0 }}>
      <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>{question.question}</p>
      <div style={{ marginTop: 10 }}>
        {question.options.map((opt, i) => {
          let state: "correct" | "incorrect" | undefined;
          if (answered) {
            if (i === selected) state = opt.correct ? "correct" : "incorrect";
            else if (opt.correct) state = "correct";
          }
          return (
            <button
              key={opt.text}
              type="button"
              className="wg-quiz-option"
              data-state={state}
              onClick={() => {
                setSelected(i);
                onAnswered();
              }}
              disabled={answered}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="wg-quiz-feedback" data-state={isCorrect ? "correct" : "incorrect"}>
          {isCorrect ? "Correct — " : "Not quite — "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

interface QuizListProps {
  quiz: LessonQuizQuestion[];
  /** Fires once every question in the set has been answered (any
   *  choice, not necessarily correct) — a "knowledge check" confirms
   *  the user engaged with each question, not that they scored 100%. */
  onAllAnswered?: () => void;
}

/** Bare list of quiz questions, no section chrome — both lesson
 *  templates (the scrolling LessonLayout and the screen-by-screen
 *  OnboardingLessonLayout) wrap this with their own heading/layout. */
export default function QuizList({ quiz, onAllAnswered }: QuizListProps) {
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    if (answeredCount >= quiz.length && quiz.length > 0) onAllAnswered?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredCount]);

  return (
    <>
      {quiz.map((q, i) => (
        <QuizQuestion question={q} index={i} key={q.question} onAnswered={() => setAnsweredCount((c) => c + 1)} />
      ))}
    </>
  );
}
