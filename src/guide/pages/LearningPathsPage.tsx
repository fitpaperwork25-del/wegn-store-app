import { GuideIcon } from "../components/icons";
import { LEARNING_PATHS, getLearningPath } from "../data/learningPaths";
import { useGuideProgress } from "../context/useGuideProgress";

interface LearningPathsPageProps {
  onViewCertificate: (pathId: string) => void;
}

export default function LearningPathsPage({ onViewCertificate }: LearningPathsPageProps) {
  const { getPathProgress, currentPathId, setCurrentPathId } = useGuideProgress();

  return (
    <div>
      <span className="wg-eyebrow">WEGN Store Academy</span>
      <h1 className="wg-page-title">Learning Paths</h1>
      <p className="wg-page-subtitle">
        Structured routes through the Academy. Complete every lesson in a path to earn its certificate.
      </p>

      {LEARNING_PATHS.map((path) => {
        const progress = getPathProgress(path.id);
        const Icon = GuideIcon[path.icon];
        const isCurrent = currentPathId === path.id;
        const prereqPath = path.prerequisitePathId ? getLearningPath(path.prerequisitePathId) : undefined;

        return (
          <div className="wg-path-card" data-locked={!progress.isUnlocked} key={path.id}>
            <div className="wg-path-card-header">
              <div className="wg-path-card-icon"><Icon /></div>
              <div style={{ flex: 1 }}>
                <p className="wg-path-card-title">
                  {path.name}
                  {progress.isCertified && <span className="wg-path-cert-badge"><GuideIcon.trophy /> Certified</span>}
                  {isCurrent && !progress.isCertified && <span className="wg-badge">Current path</span>}
                </p>
                <p className="wg-path-card-desc">{path.description}</p>
              </div>
            </div>

            {progress.isUnlocked ? (
              <>
                <div className="wg-path-progress-row">
                  <span>{progress.completedCount}/{progress.totalCount} lessons</span>
                  <span>{progress.percentComplete}%</span>
                </div>
                <div className="wg-progress-track">
                  <div className="wg-progress-fill" style={{ width: `${progress.percentComplete}%` }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {!isCurrent && (
                    <button type="button" className="wg-btn wg-btn-secondary" onClick={() => setCurrentPathId(path.id)}>
                      Set as current path
                    </button>
                  )}
                  {progress.isCertified && (
                    <button type="button" className="wg-btn wg-btn-primary" onClick={() => onViewCertificate(path.id)}>
                      <GuideIcon.trophy /> View certificate
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="wg-path-lock-note">
                <GuideIcon.bookmark />
                <span>Complete the {prereqPath?.name ?? "prerequisite"} certificate to unlock this path.</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
