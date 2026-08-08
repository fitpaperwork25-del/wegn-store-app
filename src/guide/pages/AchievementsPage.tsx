import { GuideIcon } from "../components/icons";
import { GUIDE_BADGES } from "../data/badges";
import { useGuideProgress } from "../context/useGuideProgress";

export default function AchievementsPage() {
  const { earnedBadgeIds, hasBadge, completedCount, currentStreak, longestStreak, certificates } = useGuideProgress();
  const certifiedCount = Object.keys(certificates).length;

  const milestones = [
    { title: "Complete 5 lessons", current: Math.min(completedCount, 5), target: 5 },
    { title: "Complete 10 lessons", current: Math.min(completedCount, 10), target: 10 },
    { title: "Complete 20 lessons", current: Math.min(completedCount, 20), target: 20 },
    { title: "Earn 5 badges", current: Math.min(earnedBadgeIds.size, 5), target: 5 },
    { title: "Earn your first certificate", current: Math.min(certifiedCount, 1), target: 1 },
    { title: "Reach a 7-day learning streak", current: Math.min(longestStreak, 7), target: 7 },
  ];

  return (
    <div>
      <span className="wg-eyebrow">Achievement Center</span>
      <h1 className="wg-page-title">Badges, milestones, and streaks</h1>
      <p className="wg-page-subtitle">Everything you've earned in the Academy, and what's still ahead.</p>

      <div className="wg-streak-row">
        <div className="wg-streak-card">
          <div className="wg-streak-flame"><GuideIcon.flame /></div>
          <div className="wg-streak-value">{currentStreak}</div>
          <div className="wg-streak-label">Day streak</div>
        </div>
        <div className="wg-streak-card">
          <div className="wg-streak-flame"><GuideIcon.trophy /></div>
          <div className="wg-streak-value">{longestStreak}</div>
          <div className="wg-streak-label">Longest streak</div>
        </div>
        <div className="wg-streak-card">
          <div className="wg-streak-flame"><GuideIcon.badge /></div>
          <div className="wg-streak-value">{certifiedCount}</div>
          <div className="wg-streak-label">Certificates earned</div>
        </div>
      </div>

      <p className="wg-card-title" style={{ fontSize: "0.95rem", marginBottom: 10 }}>
        Badges ({earnedBadgeIds.size}/{GUIDE_BADGES.length})
      </p>
      <div className="wg-ob-badge-shelf" style={{ marginBottom: 24 }}>
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

      <p className="wg-card-title" style={{ fontSize: "0.95rem", marginBottom: 10 }}>Milestones</p>
      {milestones.map((m) => {
        const done = m.current >= m.target;
        const percent = Math.round((m.current / m.target) * 100);
        return (
          <div className="wg-milestone-card" key={m.title}>
            <div className="wg-milestone-row">
              <span className="wg-milestone-title">
                {done ? <GuideIcon.check /> : <GuideIcon.bookmark />}
                {m.title}
              </span>
              <span className="wg-milestone-count">{m.current}/{m.target}</span>
            </div>
            <div className="wg-progress-track">
              <div className="wg-progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
