import { GuideIcon } from "../../components/icons";
import type { GuideBadge } from "../../data/badges";

interface CompletionSectionProps {
  badge: GuideBadge | undefined;
  message: string;
  nextLessonTitle: string | null;
  onGoToNext: () => void;
}

export default function CompletionSection({ badge, message, nextLessonTitle, onGoToNext }: CompletionSectionProps) {
  const BadgeIcon = badge ? GuideIcon[badge.icon] : GuideIcon.trophy;

  return (
    <div className="wg-ob-screen wg-ob-completion">
      <p className="wg-eyebrow" style={{ textAlign: "center" }}>Lesson Complete</p>
      <h2 className="wg-ob-completion-title">Nicely done.</h2>
      <p className="wg-ob-intro" style={{ textAlign: "center" }}>{message}</p>

      {badge && (
        <div className="wg-ob-badge-award">
          <div className="wg-ob-badge-medal">
            <BadgeIcon />
          </div>
          <p className="wg-ob-badge-name">{badge.name}</p>
          <p className="wg-ob-badge-desc">{badge.description}</p>
        </div>
      )}

      {nextLessonTitle && (
        <button type="button" className="wg-btn wg-btn-primary wg-ob-completion-cta" onClick={onGoToNext}>
          Continue to "{nextLessonTitle}"
          <GuideIcon.chevronRight />
        </button>
      )}
    </div>
  );
}
