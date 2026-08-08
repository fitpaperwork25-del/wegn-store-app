import { useState } from "react";
import { GuideIcon } from "../../components/icons";
import type { LessonContent } from "../types";

interface PracticeSectionProps {
  practice: LessonContent["practice"];
}

/**
 * A real checklist over practice.steps (the same data every lesson
 * already has) — each step is checked off by an actual click, not
 * just read. Same interaction as the Welcome lesson's Quick Challenge
 * checklist (lesson/onboarding/QuickChallengeSection.tsx), generalized
 * to any lesson's step list instead of a fixed mock nav.
 */
export default function PracticeSection({ practice }: PracticeSectionProps) {
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const allDone = practice.steps.length > 0 && doneSteps.size === practice.steps.length;

  return (
    <section id="wg-section-practice" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">3</span>
        <h2 className="wg-lesson-section-title">Practice</h2>
      </div>
      <p className="wg-page-subtitle" style={{ marginBottom: 16 }}>{practice.intro}</p>

      <div className="wg-sandbox wg-sandbox-active">
        <ol className="wg-ob-challenge-list">
          {practice.steps.map((step, i) => {
            const done = doneSteps.has(i);
            return (
              <li key={step.title} data-done={done}>
                <button
                  type="button"
                  className="wg-ob-challenge-check"
                  onClick={() => toggle(i)}
                  aria-pressed={done}
                  aria-label={done ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
                >
                  <GuideIcon.check />
                </button>
                <span className="wg-practice-step-text">
                  <strong>{step.title}</strong>
                  <span>{step.description}</span>
                </span>
              </li>
            );
          })}
        </ol>

        {allDone && (
          <p className="wg-practice-complete">
            <GuideIcon.check /> Nice work — you've walked through every step.
          </p>
        )}
      </div>
    </section>
  );
}
