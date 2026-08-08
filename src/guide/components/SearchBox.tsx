import { forwardRef, useMemo, useState } from "react";
import { ALL_LESSON_STUBS, GUIDE_NAV } from "../data/navigation";
import { GuideIcon } from "./icons";

interface SearchBoxProps {
  onSelectLesson: (lessonId: string) => void;
  onSelectSection: (sectionId: string) => void;
}

/**
 * Real (if simple) client-side full-text search over the static
 * nav/lesson-title list — not a mock or a stub, just scoped to what
 * Phase 1 actually has: no backend or search index to call out to,
 * so filtering an in-memory array is the honest implementation here.
 */
const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { onSelectLesson, onSelectSection },
  ref,
) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { lessons: [], sections: [] };
    return {
      lessons: ALL_LESSON_STUBS.filter((l) => l.title.toLowerCase().includes(q)).slice(0, 6),
      sections: GUIDE_NAV.filter((s) => s.label.toLowerCase().includes(q) && s.id !== "search").slice(0, 4),
    };
  }, [query]);

  const showResults = focused && query.trim().length > 0;
  const hasResults = results.lessons.length > 0 || results.sections.length > 0;

  return (
    <div className="wg-search">
      <span className="wg-search-icon">
        <GuideIcon.search />
      </span>
      <input
        ref={ref}
        type="text"
        value={query}
        placeholder="Search the academy…"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        aria-label="Search the academy"
      />
      {!focused && <span className="wg-search-kbd">/</span>}
      {showResults && (
        <div className="wg-search-results" role="listbox">
          {!hasResults && <div className="wg-search-empty">No matches for "{query}" yet.</div>}
          {results.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className="wg-search-result"
              onClick={() => {
                onSelectSection(s.id);
                setQuery("");
              }}
            >
              <span className="wg-search-result-title">{s.label}</span>
              <span className="wg-search-result-section">Section</span>
            </button>
          ))}
          {results.lessons.map((l) => (
            <button
              key={l.id}
              type="button"
              className="wg-search-result"
              onClick={() => {
                onSelectLesson(l.id);
                setQuery("");
              }}
            >
              <span className="wg-search-result-title">{l.title}</span>
              <span className="wg-search-result-section">{l.sectionLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default SearchBox;
