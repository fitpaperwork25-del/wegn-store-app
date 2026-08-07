import { useState } from "react";
import { GuideIcon } from "../../components/icons";
import type { PlatformTourStop, QuickChallengeStep } from "./types";

interface QuickChallengeSectionProps {
  intro: string;
  steps: QuickChallengeStep[];
  stops: PlatformTourStop[];
  /** Fires once every checklist step — including the final action step
   *  — has been completed. */
  onAllStepsDone: () => void;
}

/**
 * A safe, sandboxed simulation: the "nav" here is a mock of WEGN
 * Store's real navigation, not the real app — no real screen changes,
 * no data touched. Clicking a stop just checks off the matching
 * checklist step.
 */
export default function QuickChallengeSection({ intro, steps, stops, onAllStepsDone }: QuickChallengeSectionProps) {
  const [doneStepIds, setDoneStepIds] = useState<Set<string>>(new Set());
  const [activeStopId, setActiveStopId] = useState(stops[0]?.id);

  const stepsExceptFinal = steps.filter((s) => s.targetStopId);
  const finalStep = steps.find((s) => !s.targetStopId);
  const allPrereqsDone = stepsExceptFinal.every((s) => doneStepIds.has(s.id));
  const allDone = steps.every((s) => doneStepIds.has(s.id));

  const visitStop = (stopId: string) => {
    setActiveStopId(stopId);
    const matching = stepsExceptFinal.find((s) => s.targetStopId === stopId);
    if (!matching) return;
    setDoneStepIds((prev) => {
      if (prev.has(matching.id)) return prev;
      const next = new Set(prev);
      next.add(matching.id);
      return next;
    });
  };

  const completeFinalStep = () => {
    if (!finalStep || !allPrereqsDone) return;
    setDoneStepIds((prev) => {
      const next = new Set(prev);
      next.add(finalStep.id);
      return next;
    });
    onAllStepsDone();
  };

  return (
    <div className="wg-ob-screen">
      <p className="wg-ob-intro">{intro}</p>

      <div className="wg-ob-walkthrough">
        <nav className="wg-ob-mock-nav" aria-label="WEGN Store navigation (practice)">
          {stops.map((stop) => {
            const Icon = GuideIcon[stop.icon];
            const step = stepsExceptFinal.find((s) => s.targetStopId === stop.id);
            const done = step ? doneStepIds.has(step.id) : false;
            return (
              <button
                key={stop.id}
                type="button"
                className="wg-ob-mock-nav-item"
                data-active={stop.id === activeStopId}
                onClick={() => visitStop(stop.id)}
              >
                <Icon />
                <span>{stop.label}</span>
                {done && (
                  <span className="wg-ob-mock-nav-done">
                    <GuideIcon.check />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="wg-ob-card wg-card">
          <p className="wg-card-title" style={{ fontSize: "0.9rem", marginBottom: 12 }}>Your checklist</p>
          <ul className="wg-ob-challenge-list">
            {steps.map((step) => (
              <li key={step.id} data-done={doneStepIds.has(step.id)}>
                <span className="wg-ob-challenge-check">
                  <GuideIcon.check />
                </span>
                <span>{step.instruction}</span>
              </li>
            ))}
          </ul>

          {finalStep && (
            <button
              type="button"
              className="wg-btn wg-btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              disabled={!allPrereqsDone || allDone}
              onClick={completeFinalStep}
            >
              <GuideIcon.check />
              {allDone ? "Lesson marked complete" : finalStep.instruction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
