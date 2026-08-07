// Client-only progress/preferences store for the Interactive Guide.
// Explicitly NOT a backend: everything here is localStorage, scoped to
// this browser/device only. No network calls, no database, no auth -
// matches Phase 1's "no backend, no database changes" constraint while
// still giving the shell's progress/bookmark/dark-mode UI something
// real to read and write, instead of being purely decorative.
//
// This file exports only the provider component — see
// ./useGuideProgress for the context object and the consumer hook.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { GuideSectionId } from "../data/navigation";
import { ALL_LESSON_STUBS } from "../data/navigation";
import { GuideProgressContext, type GuideProgressValue } from "./useGuideProgress";

const STORAGE_KEY = "wegn-store-guide:v1";

interface StoredState {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  earnedBadgeIds: string[];
  lastSectionId: GuideSectionId | null;
  theme: "light" | "dark";
}

const DEFAULT_STATE: StoredState = {
  completedLessonIds: [],
  bookmarkedLessonIds: [],
  earnedBadgeIds: [],
  lastSectionId: null,
  theme: "light",
};

// lessonId -> prerequisiteLessonId, built once from the static nav
// data rather than per-render.
const PREREQUISITE_BY_LESSON = new Map(
  ALL_LESSON_STUBS.filter((l) => l.prerequisiteLessonId).map((l) => [l.id, l.prerequisiteLessonId as string]),
);

function loadState(): StoredState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    // Corrupt or inaccessible storage (private browsing, quota, etc.)
    // degrades to defaults rather than throwing - this is convenience
    // state, never something a lesson depends on to function.
    return DEFAULT_STATE;
  }
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (quota, private mode) - progress just
    // won't persist across reloads, which is a reasonable degradation.
  }
}

export function GuideProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Reflect the theme onto the guide root so guide.css's
  // [data-guide-theme="dark"] rules apply without touching the host
  // app's own <html>/<body> attributes (kept fully self-contained).
  useEffect(() => {
    const root = document.getElementById("wegn-guide-root");
    root?.setAttribute("data-guide-theme", state.theme);
  }, [state.theme]);

  const completedLessonIds = useMemo(() => new Set(state.completedLessonIds), [state.completedLessonIds]);
  const bookmarkedLessonIds = useMemo(() => new Set(state.bookmarkedLessonIds), [state.bookmarkedLessonIds]);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }));
  }, []);

  const markLessonComplete = useCallback((lessonId: string) => {
    setState((prev) =>
      prev.completedLessonIds.includes(lessonId)
        ? prev
        : { ...prev, completedLessonIds: [...prev.completedLessonIds, lessonId] },
    );
  }, []);

  const markLessonIncomplete = useCallback((lessonId: string) => {
    setState((prev) => ({ ...prev, completedLessonIds: prev.completedLessonIds.filter((id) => id !== lessonId) }));
  }, []);

  const toggleBookmark = useCallback((lessonId: string) => {
    setState((prev) => ({
      ...prev,
      bookmarkedLessonIds: prev.bookmarkedLessonIds.includes(lessonId)
        ? prev.bookmarkedLessonIds.filter((id) => id !== lessonId)
        : [...prev.bookmarkedLessonIds, lessonId],
    }));
  }, []);

  const setLastSectionId = useCallback((id: GuideSectionId) => {
    setState((prev) => (prev.lastSectionId === id ? prev : { ...prev, lastSectionId: id }));
  }, []);

  const earnedBadgeIds = useMemo(() => new Set(state.earnedBadgeIds), [state.earnedBadgeIds]);

  const awardBadge = useCallback((badgeId: string) => {
    setState((prev) => (prev.earnedBadgeIds.includes(badgeId) ? prev : { ...prev, earnedBadgeIds: [...prev.earnedBadgeIds, badgeId] }));
  }, []);

  const totalLessons = ALL_LESSON_STUBS.length;
  const completedCount = completedLessonIds.size;
  const percentComplete = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const value: GuideProgressValue = {
    theme: state.theme,
    toggleTheme,
    completedLessonIds,
    isLessonComplete: (id) => completedLessonIds.has(id),
    markLessonComplete,
    markLessonIncomplete,
    isLessonUnlocked: (id) => {
      const prereq = PREREQUISITE_BY_LESSON.get(id);
      return !prereq || completedLessonIds.has(prereq);
    },
    bookmarkedLessonIds,
    isBookmarked: (id) => bookmarkedLessonIds.has(id),
    toggleBookmark,
    earnedBadgeIds,
    hasBadge: (id) => earnedBadgeIds.has(id),
    awardBadge,
    lastSectionId: state.lastSectionId,
    setLastSectionId,
    totalLessons,
    completedCount,
    percentComplete,
  };

  return <GuideProgressContext.Provider value={value}>{children}</GuideProgressContext.Provider>;
}
