import { ALL_LESSON_STUBS, GUIDE_NAV, IMPLEMENTED_LESSON_IDS } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GUIDE_BADGES } from "../data/badges";
import { GuideIcon } from "../components/icons";
import { useGuideProgress } from "../context/useGuideProgress";

interface LearningProgressPageProps {
  onOpenLesson: (lessonId: string) => void;
  onGoToSection: (sectionId: GuideSectionId) => void;
}

export default function LearningProgressPage({ onOpenLesson, onGoToSection }: LearningProgressPageProps) {
  const { percentComplete, completedCount, totalLessons, completedLessonIds, bookmarkedLessonIds, isLessonUnlocked, hasBadge } =
    useGuideProgress();

  const bookmarked = ALL_LESSON_STUBS.filter((l) => bookmarkedLessonIds.has(l.id));
  const sectionsWithLessons = GUIDE_NAV.filter((s) => (s.plannedLessons?.length ?? 0) > 0);

  return (
    <div>
      <span className="wg-eyebrow">Your learning</span>
      <h1 className="wg-page-title">Learning Progress</h1>
      <p className="wg-page-subtitle">
        Tracked on this device only — nothing here is sent anywhere or tied to your account.
      </p>

      <div className="wg-card" style={{ marginBottom: 24 }}>
        <div className="wg-progress-label">
          <span>Overall completion</span>
          <span>{completedCount}/{totalLessons} lessons · {percentComplete}%</span>
        </div>
        <div className="wg-progress-track">
          <div className="wg-progress-fill" style={{ width: `${percentComplete}%` }} />
        </div>
      </div>

      <p className="wg-card-title" style={{ fontSize: "0.95rem", marginBottom: 10 }}>Badges earned</p>
      <div className="wg-ob-badge-shelf">
        {GUIDE_BADGES.map((badge) => {
          const earned = hasBadge(badge.id);
          const BadgeIcon = GuideIcon[badge.icon];
          return (
            <div className="wg-ob-badge-shelf-item" data-earned={earned} key={badge.id} title={badge.description}>
              <BadgeIcon />
              <span>{badge.name}</span>
            </div>
          );
        })}
      </div>

      <p className="wg-card-title" style={{ fontSize: "0.95rem", margin: "24px 0 10px" }}>By section</p>
      {sectionsWithLessons.map((s) => {
        const total = s.plannedLessons?.length ?? 0;
        const done = s.plannedLessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0;
        const Icon = GuideIcon[s.icon as keyof typeof GuideIcon];
        return (
          <button
            key={s.id}
            type="button"
            className="wg-lesson-row"
            style={{ width: "100%", marginBottom: 10, cursor: "pointer" }}
            onClick={() => onGoToSection(s.id)}
          >
            <span style={{ color: "var(--g-green-dark)", display: "flex" }}>{Icon ? <Icon /> : null}</span>
            <span className="wg-lesson-row-title">{s.label}</span>
            <span className="wg-lesson-row-meta">{done}/{total} complete</span>
          </button>
        );
      })}

      <p className="wg-card-title" style={{ fontSize: "0.95rem", margin: "24px 0 10px" }}>Bookmarked lessons</p>
      {bookmarked.length === 0 ? (
        <div className="wg-empty">
          <div className="wg-empty-icon">
            <GuideIcon.bookmark />
          </div>
          <p className="wg-card-body">Bookmark a lesson to find it here later.</p>
        </div>
      ) : (
        bookmarked.map((l) => {
          const clickable = IMPLEMENTED_LESSON_IDS.has(l.id) && isLessonUnlocked(l.id);
          return (
            <div key={l.id} className="wg-lesson-row" style={{ marginBottom: 10 }}>
              <span className="wg-lesson-row-title">{l.title}</span>
              <span className="wg-lesson-row-meta">{l.sectionLabel}</span>
              {clickable ? (
                <button type="button" className="wg-btn wg-btn-secondary" onClick={() => onOpenLesson(l.id)}>
                  Open
                </button>
              ) : (
                <span className="wg-badge wg-badge-soon">Coming soon</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
