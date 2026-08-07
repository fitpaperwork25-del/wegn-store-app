import { useMemo, useState } from "react";
import { ALL_LESSON_STUBS, GUIDE_NAV, SAMPLE_LESSON_ID } from "../data/navigation";
import type { GuideSectionId } from "../data/navigation";
import { GuideIcon } from "../components/icons";

interface SearchPageProps {
  onGoToSection: (sectionId: GuideSectionId) => void;
  onOpenLesson: (lessonId: string) => void;
}

export default function SearchPage({ onGoToSection, onOpenLesson }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const lessons = useMemo(
    () => (q ? ALL_LESSON_STUBS.filter((l) => l.title.toLowerCase().includes(q)) : ALL_LESSON_STUBS),
    [q],
  );
  const sections = useMemo(
    () => (q ? GUIDE_NAV.filter((s) => s.label.toLowerCase().includes(q) && s.id !== "search") : []),
    [q],
  );

  return (
    <div>
      <span className="wg-eyebrow">Search</span>
      <h1 className="wg-page-title">Find a topic or lesson</h1>
      <div className="wg-search" style={{ maxWidth: 460, marginBottom: 28 }}>
        <span className="wg-search-icon">
          <GuideIcon.search />
        </span>
        <input
          type="text"
          value={query}
          placeholder="Search the guide…"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the guide"
        />
      </div>

      {sections.length > 0 && (
        <>
          <p className="wg-card-title" style={{ fontSize: "0.9rem", marginBottom: 10 }}>Sections</p>
          {sections.map((s) => (
            <div key={s.id} className="wg-lesson-row" style={{ marginBottom: 10 }}>
              <span className="wg-lesson-row-title">{s.label}</span>
              <button type="button" className="wg-btn wg-btn-secondary" onClick={() => onGoToSection(s.id)}>
                Open
              </button>
            </div>
          ))}
        </>
      )}

      <p className="wg-card-title" style={{ fontSize: "0.9rem", marginBottom: 10 }}>
        {q ? "Lessons" : "All planned lessons"}
      </p>
      {lessons.length === 0 && (
        <div className="wg-empty">
          <p className="wg-card-body">No lessons match "{query}" yet.</p>
        </div>
      )}
      {lessons.map((l) => {
        const isSample = l.id === SAMPLE_LESSON_ID;
        return (
          <div key={l.id} className="wg-lesson-row" style={{ marginBottom: 10 }}>
            <span className="wg-lesson-row-title">{l.title}</span>
            <span className="wg-lesson-row-meta">{l.sectionLabel} · {l.minutes} min</span>
            {isSample ? (
              <button type="button" className="wg-btn wg-btn-secondary" onClick={() => onOpenLesson(l.id)}>
                Open
              </button>
            ) : (
              <span className="wg-badge wg-badge-soon">Coming soon</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
