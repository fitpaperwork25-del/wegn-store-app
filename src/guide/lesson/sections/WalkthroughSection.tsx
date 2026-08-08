import { useState } from "react";
import { GuideIcon } from "../../components/icons";
import type { LessonContent } from "../types";

interface WalkthroughSectionProps {
  walkthrough: LessonContent["walkthrough"];
}

/**
 * A real, click-through walkthrough of the lesson's screen: one
 * control spotlighted at a time (from walkthrough.callouts — the same
 * data every lesson already has), advanced by Previous/Next or by
 * clicking a control directly. Same interaction pattern as the
 * Welcome lesson's platform tour (lesson/onboarding/
 * InteractiveWalkthroughSection.tsx), generalized to any lesson's
 * callout list instead of the fixed 8 platform areas.
 */
export default function WalkthroughSection({ walkthrough }: WalkthroughSectionProps) {
  const { screenLabel, callouts } = walkthrough;
  const [index, setIndex] = useState(0);

  if (callouts.length === 0) return null;
  const clamped = Math.min(index, callouts.length - 1);
  const active = callouts[clamped];
  const isLast = clamped === callouts.length - 1;

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(callouts.length - 1, next)));

  return (
    <section id="wg-section-walkthrough" className="wg-lesson-section">
      <div className="wg-lesson-section-kicker">
        <span className="wg-lesson-section-num">2</span>
        <h2 className="wg-lesson-section-title">Interactive Walkthrough</h2>
      </div>
      <div className="wg-walkthrough-frame">
        <p className="wg-walkthrough-screen-label">{screenLabel}</p>
        <div className="wg-ob-walkthrough">
          <nav className="wg-ob-mock-nav" aria-label={screenLabel}>
            {callouts.map((c, i) => (
              <button
                key={c.label}
                type="button"
                className="wg-ob-mock-nav-item"
                data-active={i === clamped}
                onClick={() => goTo(i)}
              >
                <span>{c.title}</span>
              </button>
            ))}
          </nav>

          <div className="wg-ob-tooltip-card" key={active.label}>
            <div className="wg-ob-tooltip-icon">
              <span aria-hidden="true">{active.label}</span>
            </div>
            <p className="wg-ob-tooltip-label">{active.title}</p>
            <p className="wg-ob-tooltip-desc">{active.description}</p>
            <div className="wg-ob-tooltip-nav">
              <button
                type="button"
                className="wg-btn wg-btn-secondary"
                onClick={() => goTo(clamped - 1)}
                disabled={clamped === 0}
              >
                <GuideIcon.chevronLeft /> Previous
              </button>
              <span className="wg-ob-tooltip-count">{clamped + 1} / {callouts.length}</span>
              <button
                type="button"
                className="wg-btn wg-btn-secondary"
                onClick={() => goTo(clamped + 1)}
                disabled={isLast}
              >
                Next <GuideIcon.chevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
