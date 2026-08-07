import { GuideIcon } from "../../components/icons";
import type { PlatformTourStop } from "./types";

export default function PlatformTourSection({ stops }: { stops: PlatformTourStop[] }) {
  return (
    <div className="wg-ob-screen">
      <p className="wg-ob-intro">Eight areas make up WEGN Store. Here's what each one is for.</p>
      <div className="wg-ob-tour-grid">
        {stops.map((stop) => {
          const Icon = GuideIcon[stop.icon];
          return (
            <div className="wg-ob-tour-card" key={stop.id}>
              <div className="wg-ob-tour-card-icon">
                <Icon />
              </div>
              <p className="wg-ob-tour-card-label">{stop.label}</p>
              <p className="wg-ob-tour-card-desc">{stop.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
