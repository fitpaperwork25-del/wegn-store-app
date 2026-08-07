import type { LessonContent } from "../types";

export default function TipsSection({ tips }: { tips: LessonContent["tips"] }) {
  return (
    <section id="wg-section-tips" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">4</span>
        <h2 className="wg-lesson-section-title">Tips</h2>
      </div>
      <div className="wg-tip-grid">
        <div className="wg-tip-card wg-tip-card-good">
          <span className="wg-tip-card-label">Best practice</span>
          <ul>
            {tips.good.map((t) => (
              <li key={t.text}>{t.text}</li>
            ))}
          </ul>
        </div>
        <div className="wg-tip-card wg-tip-card-warn">
          <span className="wg-tip-card-label">Watch out for</span>
          <ul>
            {tips.watchOutFor.map((t) => (
              <li key={t.text}>{t.text}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
