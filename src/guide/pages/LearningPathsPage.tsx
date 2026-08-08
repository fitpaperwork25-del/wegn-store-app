import { GuideIcon } from "../components/icons";
import { LEARNING_PATHS, getLearningPath } from "../data/learningPaths";
import { IMPLEMENTED_LESSON_IDS } from "../data/navigation";
import { formatDate } from "../lib/format";
import { useGuideProgress } from "../context/useGuideProgress";

interface LearningPathsPageProps {
  onViewCertificate: (pathId: string) => void;
  onOpenLesson: (lessonId: string) => void;
}

/** A path's status is always derived from real progress — never stored
 *  or hardcoded — so it can't drift from the lessons that are actually
 *  complete. */
type PathStatus = "locked" | "not-started" | "in-progress" | "completed";

function getPathStatus(isUnlocked: boolean, isCertified: boolean, completedCount: number): PathStatus {
  if (!isUnlocked) return "locked";
  if (isCertified) return "completed";
  if (completedCount > 0) return "in-progress";
  return "not-started";
}

const STATUS_LABEL: Record<PathStatus, string> = {
  locked: "Locked",
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

export default function LearningPathsPage({ onViewCertificate, onOpenLesson }: LearningPathsPageProps) {
  const { getPathProgress, currentPathId, setCurrentPathId, isLessonComplete } = useGuideProgress();

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
        const status = getPathStatus(progress.isUnlocked, progress.isCertified, progress.completedCount);

        // The next lesson to continue with: the first lesson in this
        // path's real sequence that isn't complete yet, skipping any
        // id that has no built lesson behind it (a "coming soon" stub
        // can't be opened). null once every buildable lesson is done.
        const nextLessonId = path.lessonIds.find(
          (id) => IMPLEMENTED_LESSON_IDS.has(id) && !isLessonComplete(id),
        ) ?? null;

        return (
          <div className="wg-path-card" data-locked={!progress.isUnlocked} key={path.id}>
            <div className="wg-path-card-header">
              <div className="wg-path-card-icon"><Icon /></div>
              <div style={{ flex: 1 }}>
                <p className="wg-path-card-title">
                  {path.name}
                  <span className="wg-badge">{STATUS_LABEL[status]}</span>
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
                {progress.isCertified && progress.certifiedAt && (
                  <p className="wg-path-card-desc" style={{ marginTop: 8 }}>
                    Completed {formatDate(progress.certifiedAt)}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {!progress.isCertified && nextLessonId && (
                    <button type="button" className="wg-btn wg-btn-primary" onClick={() => onOpenLesson(nextLessonId)}>
                      <GuideIcon.chevronRight /> Continue learning
                    </button>
                  )}
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
