import { GUIDE_NAV, SAMPLE_LESSON_ID } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "../components/icons";
import { useGuideProgress } from "../context/useGuideProgress";

interface HomePageProps {
  onGoToSection: (sectionId: GuideSectionId) => void;
  onOpenLesson: (lessonId: string) => void;
}

const BROWSE_SECTIONS = GUIDE_NAV.filter((n) => n.id !== "home" && n.id !== "search" && n.id !== "learning-progress");

export default function HomePage({ onGoToSection, onOpenLesson }: HomePageProps) {
  const { percentComplete, completedCount, totalLessons, lastSectionId } = useGuideProgress();
  const resumeSection = lastSectionId ? GUIDE_NAV.find((n) => n.id === lastSectionId) : null;

  return (
    <div>
      <span className="wg-eyebrow">WEGN Store Guide</span>
      <h1 className="wg-page-title">Learn WEGN Store by doing.</h1>
      <p className="wg-page-subtitle">
        Short, hands-on lessons for every part of the platform — no manuals, no reading walls. Pick a topic below or
        jump into the first lesson.
      </p>

      <div className="wg-card" style={{ marginBottom: 24 }}>
        <div className="wg-progress-label">
          <span>Your progress</span>
          <span>{completedCount}/{totalLessons} lessons</span>
        </div>
        <div className="wg-progress-track">
          <div className="wg-progress-fill" style={{ width: `${percentComplete}%` }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" className="wg-btn wg-btn-primary" onClick={() => onOpenLesson(SAMPLE_LESSON_ID)}>
            Start "Ringing up your first sale"
          </button>
          {resumeSection && resumeSection.id !== "getting-started" && (
            <button type="button" className="wg-btn wg-btn-secondary" onClick={() => onGoToSection(resumeSection.id)}>
              Continue in {resumeSection.label}
            </button>
          )}
        </div>
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
