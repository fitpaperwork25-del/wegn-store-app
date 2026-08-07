import { GuideIcon } from "../../components/icons";
import type { LessonContent } from "../types";

export default function PracticeSection({ practice }: { practice: LessonContent["practice"] }) {
  return (
    <section id="wg-section-practice" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">3</span>
        <h2 className="wg-lesson-section-title">Practice</h2>
      </div>
      <p className="wg-page-subtitle" style={{ marginBottom: 16 }}>
        {practice.intro}
      </p>
      <div className="wg-sandbox">
        <div className="wg-sandbox-icon">
          <GuideIcon.box />
        </div>
        <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>Safe practice sandbox</p>
        <p className="wg-card-body" style={{ maxWidth: 440, margin: "0 auto" }}>
          No real data is touched here. The interactive, step-by-step simulation is built in a later phase —
          for now, here's what you'd practice:
        </p>
      </div>
      <ol className="wg-callout-list" style={{ marginTop: 16 }}>
        {practice.steps.map((step, i) => (
          <li className="wg-callout" key={step.title}>
            <span className="wg-callout-dot">{i + 1}</span>
            <span className="wg-callout-text">
              <strong>{step.title}</strong>
              <span>{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
