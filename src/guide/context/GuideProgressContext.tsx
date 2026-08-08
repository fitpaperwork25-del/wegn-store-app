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
import { LEARNING_PATHS } from "../data/learningPaths";
import { getLevelForCompletedCount } from "../data/levels";
import { GuideProgressContext, type GuideProgressValue, type PathProgress } from "./useGuideProgress";

const STORAGE_KEY = "wegn-store-guide:v1";

interface StoredState {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  earnedBadgeIds: string[];
  lastSectionId: GuideSectionId | null;
  theme: "light" | "dark";
  userRole: string | null;
  learnerName: string;
  currentPathId: string | null;
  certificates: Record<string, string>;
  lastActiveDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

const DEFAULT_STATE: StoredState = {
  completedLessonIds: [],
  bookmarkedLessonIds: [],
  earnedBadgeIds: [],
  lastSectionId: null,
  theme: "light",
  userRole: null,
  learnerName: "",
  currentPathId: null,
  certificates: {},
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

// lessonId -> prerequisiteLessonId, and lessonId -> minutes, both
// built once from the static nav data rather than per-render.
const PREREQUISITE_BY_LESSON = new Map(
  ALL_LESSON_STUBS.filter((l) => l.prerequisiteLessonId).map((l) => [l.id, l.prerequisiteLessonId as string]),
);
const MINUTES_BY_LESSON = new Map(ALL_LESSON_STUBS.map((l) => [l.id, l.minutes]));

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // yyyy-mm-dd, local clock is fine for a streak
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / msPerDay);
}

/** Any path whose every lesson is now in completedLessonIds, and that
 *  isn't already certified, gets stamped with today's date. Pure — the
 *  caller folds the result into the same state update that completed
 *  the lesson, rather than reacting to the change in a separate effect. */
function withNewCertificates(completedLessonIds: string[], certificates: Record<string, string>): Record<string, string> {
  let next = certificates;
  for (const path of LEARNING_PATHS) {
    if (next[path.id]) continue;
    const allDone = path.lessonIds.every((id) => completedLessonIds.includes(id));
    if (allDone) next = { ...next, [path.id]: todayKey() };
  }
  return next;
}

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
    setState((prev) => {
      if (prev.completedLessonIds.includes(lessonId)) return prev;

      // Learning streak: count today, and bump the streak only if
      // yesterday was the last active day — any bigger gap resets it.
      const today = todayKey();
      let currentStreak = prev.currentStreak;
      if (prev.lastActiveDate === today) {
        // already counted today, streak unchanged
      } else if (prev.lastActiveDate && daysBetween(prev.lastActiveDate, today) === 1) {
        currentStreak = prev.currentStreak + 1;
      } else {
        currentStreak = 1;
      }

      const completedLessonIds = [...prev.completedLessonIds, lessonId];

      return {
        ...prev,
        completedLessonIds,
        lastActiveDate: today,
        currentStreak,
        longestStreak: Math.max(prev.longestStreak, currentStreak),
        certificates: withNewCertificates(completedLessonIds, prev.certificates),
      };
    });
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

  const setUserRole = useCallback((roleId: string) => {
    setState((prev) => ({ ...prev, userRole: roleId }));
  }, []);

  const setLearnerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, learnerName: name }));
  }, []);

  const setCurrentPathId = useCallback((pathId: string | null) => {
    setState((prev) => ({ ...prev, currentPathId: pathId }));
  }, []);

  const totalLessons = ALL_LESSON_STUBS.length;
  const completedCount = completedLessonIds.size;
  const percentComplete = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const timeSpentMinutes = useMemo(() => {
    let total = 0;
    for (const id of completedLessonIds) total += MINUTES_BY_LESSON.get(id) ?? 0;
    return total;
  }, [completedLessonIds]);

  const isPathCertified = useCallback((pathId: string) => Boolean(state.certificates[pathId]), [state.certificates]);

  const getPathProgress = useCallback(
    (pathId: string): PathProgress => {
      const path = LEARNING_PATHS.find((p) => p.id === pathId);
      if (!path) {
        return { pathId, completedCount: 0, totalCount: 0, percentComplete: 0, isUnlocked: true, isCertified: false, certifiedAt: null };
      }
      const done = path.lessonIds.filter((id) => completedLessonIds.has(id)).length;
      const total = path.lessonIds.length;
      const unlocked = !path.prerequisitePathId || isPathCertified(path.prerequisitePathId);
      return {
        pathId,
        completedCount: done,
        totalCount: total,
        percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
        isUnlocked: unlocked,
        isCertified: isPathCertified(pathId),
        certifiedAt: state.certificates[pathId] ?? null,
      };
    },
    [completedLessonIds, isPathCertified, state.certificates],
  );

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
    lessonsRemaining: totalLessons - completedCount,
    percentComplete,
    timeSpentMinutes,
    level: getLevelForCompletedCount(completedCount),
    lastActiveDate: state.lastActiveDate,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    userRole: state.userRole,
    setUserRole,
    learnerName: state.learnerName,
    setLearnerName,
    currentPathId: state.currentPathId,
    setCurrentPathId,
    getPathProgress,
    certificates: state.certificates,
    isPathCertified,
  };

  return <GuideProgressContext.Provider value={value}>{children}</GuideProgressContext.Provider>;
}
