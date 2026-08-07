import { useState } from "react";
import type { LessonContent } from "../types";

function QuizQuestion({ question, index }: { question: LessonContent["quiz"][number]; index: number }) {
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
              onClick={() => setSelected(i)}
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

export default function KnowledgeCheckSection({ quiz }: { quiz: LessonContent["quiz"] }) {
  return (
    <section id="wg-section-quiz" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">5</span>
        <h2 className="wg-lesson-section-title">Knowledge Check</h2>
      </div>
      {quiz.map((q, i) => (
        <QuizQuestion question={q} index={i} key={q.question} />
      ))}
    </section>
  );
}
