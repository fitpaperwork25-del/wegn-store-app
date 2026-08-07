import { useState } from "react";
import { GuideIcon } from "../../components/icons";
import type { PlatformTourStop } from "./types";

interface InteractiveWalkthroughSectionProps {
  stops: PlatformTourStop[];
  /** Fires once the user has stepped through every stop at least once
   *  — the lesson uses this to unlock the outer "Next" button, so the
   *  screen genuinely requires the action the spec asks for. */
  onAllSeen: () => void;
}

export default function InteractiveWalkthroughSection({ stops, onAllSeen }: InteractiveWalkthroughSectionProps) {
  const [index, setIndex] = useState(0);
  const active = stops[index];
  const isLast = index === stops.length - 1;
  const ActiveIcon = GuideIcon[active.icon];

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(stops.length - 1, next));
    setIndex(clamped);
    if (clamped === stops.length - 1) onAllSeen();
  };

  return (
    <div className="wg-ob-screen">
      <p className="wg-ob-intro">Tap through the real navigation to see what each item does.</p>

      <div className="wg-ob-walkthrough">
        <nav className="wg-ob-mock-nav" aria-label="WEGN Store navigation preview">
          {stops.map((stop, i) => {
            const Icon = GuideIcon[stop.icon];
            return (
              <button
                key={stop.id}
                type="button"
                className="wg-ob-mock-nav-item"
                data-active={i === index}
                onClick={() => goTo(i)}
              >
                <Icon />
                <span>{stop.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="wg-ob-tooltip-card" key={active.id}>
          <div className="wg-ob-tooltip-icon">
            <ActiveIcon />
          </div>
          <p className="wg-ob-tooltip-label">{active.label}</p>
          <p className="wg-ob-tooltip-desc">{active.description}</p>
          <div className="wg-ob-tooltip-nav">
            <button type="button" className="wg-btn wg-btn-secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
              <GuideIcon.chevronLeft /> Previous
            </button>
            <span className="wg-ob-tooltip-count">{index + 1} / {stops.length}</span>
            <button type="button" className="wg-btn wg-btn-secondary" onClick={() => goTo(index + 1)} disabled={isLast}>
              Next <GuideIcon.chevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
