import { GuideIcon } from "../../components/icons";
import type { OnboardingLessonContent } from "./types";

export default function WelcomeSection({ welcome }: { welcome: OnboardingLessonContent["welcome"] }) {
  return (
    <div className="wg-ob-screen">
      <img src="/logo.png" alt="WEGN Store" className="wg-ob-hero-mark" />
      <p className="wg-ob-intro">{welcome.intro}</p>

      <div className="wg-ob-two-col">
        <div className="wg-card wg-ob-card">
          <p className="wg-card-title" style={{ fontSize: "0.9rem" }}>What it solves</p>
          <ul className="wg-ob-check-list">
            {welcome.problems.map((p) => (
              <li key={p}>
                <GuideIcon.check />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="wg-card wg-ob-card">
          <p className="wg-card-title" style={{ fontSize: "0.9rem" }}>What you'll learn</p>
          <ul className="wg-ob-check-list">
            {welcome.youWillLearn.map((p) => (
              <li key={p}>
                <GuideIcon.flag />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
