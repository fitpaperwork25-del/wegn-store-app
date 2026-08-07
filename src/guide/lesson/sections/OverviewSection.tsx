import type { LessonContent } from "../types";

export default function OverviewSection({ overview }: { overview: LessonContent["overview"] }) {
  return (
    <section id="wg-section-overview" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">1</span>
        <h2 className="wg-lesson-section-title">Overview</h2>
      </div>
      <div className="wg-card">
        <p className="wg-card-body">{overview.summary}</p>
      </div>
      <div className="wg-card" style={{ marginTop: 12 }}>
        <p className="wg-card-title" style={{ fontSize: "0.9rem" }}>Why it matters</p>
        <p className="wg-card-body">{overview.whyItMatters}</p>
      </div>
    </section>
  );
}
