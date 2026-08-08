import { GuideIcon } from "./icons";
import { ACADEMY_ROLES } from "../data/roles";
import { useGuideProgress } from "../context/useGuideProgress";

interface RoleSelectorProps {
  onDone: () => void;
}

/** Shown once, the first time someone opens the Academy (userRole is
 *  still null). Picking a role sets a recommended learning path;
 *  "Skip for now" records userRole as "skipped" so this screen never
 *  nags again, without pretending to know the person's role. */
export default function RoleSelector({ onDone }: RoleSelectorProps) {
  const { setUserRole, setCurrentPathId } = useGuideProgress();

  const choose = (roleId: string, recommendedPathId: string) => {
    setUserRole(roleId);
    setCurrentPathId(recommendedPathId);
    onDone();
  };

  const skip = () => {
    setUserRole("skipped");
    onDone();
  };

  return (
    <div className="wg-role-select">
      <div className="wg-role-select-inner">
        <div className="wg-ob-hero-mark" style={{ margin: "0 auto 18px" }}>
          <GuideIcon.trophy />
        </div>
        <span className="wg-eyebrow" style={{ textAlign: "center", display: "block" }}>Welcome to</span>
        <h1 className="wg-page-title" style={{ textAlign: "center" }}>WEGN Store Academy</h1>
        <p className="wg-ob-intro">What's your role? We'll recommend the right learning path to start with.</p>

        <div className="wg-role-grid">
          {ACADEMY_ROLES.map((role) => {
            const Icon = GuideIcon[role.icon];
            return (
              <button
                key={role.id}
                type="button"
                className="wg-role-card"
                onClick={() => choose(role.id, role.recommendedPathId)}
              >
                <span className="wg-role-card-icon">
                  <Icon />
                </span>
                <span className="wg-role-card-name">{role.name}</span>
                <span className="wg-role-card-desc">{role.description}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="wg-role-skip" onClick={skip}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
