import type { LessonContent } from "../types";

export default function WalkthroughSection({ walkthrough }: { walkthrough: LessonContent["walkthrough"] }) {
  return (
    <section id="wg-section-walkthrough" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">2</span>
        <h2 className="wg-lesson-section-title">Interactive Walkthrough</h2>
      </div>
      <div className="wg-walkthrough-frame">
        {/* Phase 1: labeled placeholder standing in for the real screen
            capture/highlight. Phase 2 replaces this with an actual
            annotated screenshot or live-highlighted UI region — the
            callout list below it already reflects the real structure. */}
        <div className="wg-walkthrough-screen">{walkthrough.screenLabel}</div>
        <ol className="wg-callout-list">
          {walkthrough.callouts.map((c) => (
            <li className="wg-callout" key={c.label}>
              <span className="wg-callout-dot">{c.label}</span>
              <span className="wg-callout-text">
                <strong>{c.title}</strong>
                <span>{c.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
