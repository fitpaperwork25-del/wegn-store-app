import { ALL_LESSON_STUBS, GUIDE_NAV, IMPLEMENTED_LESSON_IDS } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "../components/icons";
import { GUIDE_BADGES } from "../data/badges";
import { getLearningPath } from "../data/learningPaths";
import { getNextLevel } from "../data/levels";
import { formatMinutes } from "../lib/format";
import { useGuideProgress } from "../context/useGuideProgress";

interface HomePageProps {
  onGoToSection: (sectionId: GuideSectionId) => void;
  onOpenLesson: (lessonId: string) => void;
}

const EXCLUDED_FROM_BROWSE = new Set(["home", "search", "learning-progress", "learning-paths", "achievements"]);
const BROWSE_SECTIONS = GUIDE_NAV.filter((n) => !EXCLUDED_FROM_BROWSE.has(n.id));
const IMPLEMENTED_LESSONS = ALL_LESSON_STUBS.filter((l) => IMPLEMENTED_LESSON_IDS.has(l.id));

export default function HomePage({ onGoToSection, onOpenLesson }: HomePageProps) {
  const {
    percentComplete,
    completedCount,
    lessonsRemaining,
    totalLessons,
    lastSectionId,
    isLessonComplete,
    isLessonUnlocked,
    timeSpentMinutes,
    level,
    earnedBadgeIds,
    currentPathId,
    getPathProgress,
  } = useGuideProgress();
  const resumeSection = lastSectionId ? GUIDE_NAV.find((n) => n.id === lastSectionId) : null;
  const nextLevel = getNextLevel(completedCount);
  const currentPath = currentPathId ? getLearningPath(currentPathId) : undefined;
  const currentPathProgress = currentPathId ? getPathProgress(currentPathId) : null;

  // The next lesson worth pointing the user at: the first implemented,
  // unlocked lesson they haven't finished yet. Once everything built
  // so far is done, offer to replay the first one.
  const nextUpLesson =
    IMPLEMENTED_LESSONS.find((l) => isLessonUnlocked(l.id) && !isLessonComplete(l.id)) ?? IMPLEMENTED_LESSONS[0];

  return (
    <div>
      <span className="wg-eyebrow">WEGN Store Academy</span>
      <h1 className="wg-page-title">Learn WEGN Store by doing.</h1>
      <p className="wg-page-subtitle">
        Short, hands-on lessons for every part of the platform — no manuals, no reading walls. Pick a topic below or
        jump into the first lesson.
      </p>

      <div className="wg-dash-stats">
        <div className="wg-dash-stat">
          <div className="wg-dash-stat-icon"><GuideIcon.check /></div>
          <div className="wg-dash-stat-value">{completedCount}</div>
          <div className="wg-dash-stat-label">Lessons completed</div>
        </div>
        <div className="wg-dash-stat">
          <div className="wg-dash-stat-icon"><GuideIcon.flag /></div>
          <div className="wg-dash-stat-value">{lessonsRemaining}</div>
          <div className="wg-dash-stat-label">Lessons remaining</div>
        </div>
        <div className="wg-dash-stat">
          <div className="wg-dash-stat-icon"><GuideIcon.sun /></div>
          <div className="wg-dash-stat-value">{formatMinutes(timeSpentMinutes)}</div>
          <div className="wg-dash-stat-label">Time spent learning</div>
        </div>
        <div className="wg-dash-stat">
          <div className="wg-dash-stat-icon"><GuideIcon.badge /></div>
          <div className="wg-dash-stat-value">{level.name}</div>
          <div className="wg-dash-stat-label">
            {nextLevel ? `${nextLevel.minLessons - completedCount} lessons to ${nextLevel.name}` : "Top level reached"}
          </div>
        </div>
      </div>

      <div className="wg-card" style={{ marginBottom: 16 }}>
        <div className="wg-progress-label">
          <span>Overall progress</span>
          <span>{completedCount}/{totalLessons} lessons</span>
        </div>
        <div className="wg-progress-track">
          <div className="wg-progress-fill" style={{ width: `${percentComplete}%` }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {nextUpLesson && (
            <button type="button" className="wg-btn wg-btn-primary" onClick={() => onOpenLesson(nextUpLesson.id)}>
              {completedCount === 0 ? "Start" : "Continue"} "{nextUpLesson.title}"
            </button>
          )}
          {resumeSection && resumeSection.id !== "getting-started" && (
            <button type="button" className="wg-btn wg-btn-secondary" onClick={() => onGoToSection(resumeSection.id)}>
              Continue in {resumeSection.label}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <button type="button" className="wg-card" style={{ textAlign: "left", border: "1px solid var(--g-line)" }} onClick={() => onGoToSection("achievements")}>
          <div className="wg-dash-stat-icon" style={{ marginBottom: 10 }}><GuideIcon.trophy /></div>
          <p className="wg-card-title" style={{ fontSize: "0.94rem" }}>{earnedBadgeIds.size}/{GUIDE_BADGES.length} badges earned</p>
          <p className="wg-card-body">Open the Achievement Center →</p>
        </button>
        <button type="button" className="wg-card" style={{ textAlign: "left", border: "1px solid var(--g-line)" }} onClick={() => onGoToSection("learning-paths")}>
          <div className="wg-dash-stat-icon" style={{ marginBottom: 10 }}><GuideIcon.compass /></div>
          <p className="wg-card-title" style={{ fontSize: "0.94rem" }}>
            {currentPath ? currentPath.name : "Choose a learning path"}
          </p>
          <p className="wg-card-body">
            {currentPathProgress
              ? `${currentPathProgress.completedCount}/${currentPathProgress.totalCount} lessons · ${currentPathProgress.percentComplete}%`
              : "See all 5 Academy learning paths →"}
          </p>
        </button>
      </div>

      <p className="wg-card-title" style={{ fontSize: "1rem", marginBottom: 12 }}>Browse by topic</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {BROWSE_SECTIONS.map((item) => {
          const Icon = GuideIcon[item.icon as keyof typeof GuideIcon];
          const count = item.plannedLessons?.length ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              className="wg-card"
              style={{ textAlign: "left", border: "1px solid var(--g-line)" }}
              onClick={() => onGoToSection(item.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "var(--g-green-dark)" }}>
                {Icon ? <Icon /> : null}
              </div>
              <p className="wg-card-title" style={{ fontSize: "0.94rem" }}>{item.label}</p>
              <p className="wg-card-body">{count > 0 ? `${count} lessons planned` : "Coming soon"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
