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
import { resolveLearnerIdentity } from "../lib/identity";
import {
  GuideProgressContext,
  type AcademyProfile,
  type CertificateRecord,
  type GuideProgressValue,
  type PathProgress,
} from "./useGuideProgress";

const STORAGE_KEY = "wegn-store-guide:v1";

const DEFAULT_PROFILE: AcademyProfile = { fullName: "", email: "", organization: "", role: "owner" };

interface StoredState {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  earnedBadgeIds: string[];
  lastSectionId: GuideSectionId | null;
  theme: "light" | "dark";
  userRole: string | null;
  /** The Academy's own learner profile — see AcademyProfile. Not tied
   *  to any Store table, so a Partner or Promoter with no Store record
   *  at all can still hold a complete, correctly-labeled profile. */
  profile: AcademyProfile;
  currentPathId: string | null;
  certificates: Record<string, CertificateRecord>;
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
  profile: DEFAULT_PROFILE,
  currentPathId: null,
  certificates: {},
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

/** Pre-profile installs stored a bare `learnerName` string (and,
 *  briefly, a separate `businessName`). Migrated once into the new
 *  profile shape so nobody's already-typed name gets silently dropped. */
function migrateProfile(parsed: Record<string, unknown>): AcademyProfile {
  if (parsed.profile && typeof parsed.profile === "object") {
    return { ...DEFAULT_PROFILE, ...(parsed.profile as Partial<AcademyProfile>) };
  }
  const legacyName = typeof parsed.learnerName === "string" ? parsed.learnerName : "";
  const legacyBusiness = typeof parsed.businessName === "string" ? parsed.businessName : "";
  if (!legacyName && !legacyBusiness) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, fullName: legacyName, organization: legacyBusiness };
}

/** Stable, human-readable, and unique enough for a client-only academy
 *  with no backend of its own: readable prefix + path + award date for
 *  at-a-glance identification, plus a random suffix so two businesses
 *  certifying the same path on the same date never collide. Generated
 *  once, at the moment a certificate is first awarded (or migrated —
 *  see loadState), and never regenerated after that. */
function generateCertificateId(pathId: string, dateKey: string): string {
  const datePart = dateKey.replace(/-/g, "");
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `WSA-${pathId.toUpperCase()}-${datePart}-${randomPart.toUpperCase()}`;
}

/** Certificates were originally stored as a bare `pathId -> dateString`
 *  map. Anyone who already earned one under that shape gets migrated
 *  in place to a real CertificateRecord (with a certificate id
 *  generated once, right here, so it's stable from this point on)
 *  instead of losing their certificate or getting a blank id. */
function migrateCertificates(raw: unknown): Record<string, CertificateRecord> {
  if (!raw || typeof raw !== "object") return {};
  const next: Record<string, CertificateRecord> = {};
  for (const [pathId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      next[pathId] = { awardedAt: value, certificateId: generateCertificateId(pathId, value) };
    } else if (value && typeof value === "object" && "awardedAt" in value && "certificateId" in value) {
      next[pathId] = value as CertificateRecord;
    }
  }
  return next;
}

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
 *  isn't already certified, gets stamped with today's date and a fresh
 *  certificate id. Pure — the caller folds the result into the same
 *  state update that completed the lesson, rather than reacting to the
 *  change in a separate effect. */
function withNewCertificates(
  completedLessonIds: string[],
  certificates: Record<string, CertificateRecord>,
): Record<string, CertificateRecord> {
  let next = certificates;
  for (const path of LEARNING_PATHS) {
    if (next[path.id]) continue;
    const allDone = path.lessonIds.every((id) => completedLessonIds.includes(id));
    if (allDone) {
      const awardedAt = todayKey();
      next = { ...next, [path.id]: { awardedAt, certificateId: generateCertificateId(path.id, awardedAt) } };
    }
  }
  return next;
}

function loadState(): StoredState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      certificates: migrateCertificates(parsed.certificates),
      profile: migrateProfile(parsed),
    };
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

  // Auto-suggest the Academy profile, once, from whatever Supabase
  // session is already live (see lib/identity.ts) — but only while the
  // profile is still completely untouched (every field blank), so a
  // manual edit — including a Partner or Promoter filling in their own
  // profile with no Store account behind it at all — is never
  // overwritten. A resolution failure (signed out, offline, RLS) just
  // leaves the form exactly as it was: blank and editable, same as
  // before this existed.
  useEffect(() => {
    let cancelled = false;
    const p = state.profile;
    if (p.fullName.trim() || p.email.trim() || p.organization.trim()) return;
    resolveLearnerIdentity().then((resolved) => {
      if (cancelled) return;
      if (!resolved.fullName && !resolved.email && !resolved.organization && !resolved.role) return;
      setState((prev) => {
        const cur = prev.profile;
        if (cur.fullName.trim() || cur.email.trim() || cur.organization.trim()) return prev;
        return {
          ...prev,
          profile: {
            fullName: resolved.fullName ?? cur.fullName,
            email: resolved.email ?? cur.email,
            organization: resolved.organization ?? cur.organization,
            role: resolved.role ?? cur.role,
          },
        };
      });
    });
    return () => {
      cancelled = true;
    };
    // Intentionally runs once per mount: identity doesn't change during
    // a session, and re-running on every learnerName edit would fight
    // the user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const setProfile = useCallback((patch: Partial<AcademyProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
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
        return { pathId, completedCount: 0, totalCount: 0, percentComplete: 0, isUnlocked: true, isCertified: false, certifiedAt: null, certificateId: null };
      }
      const done = path.lessonIds.filter((id) => completedLessonIds.has(id)).length;
      const total = path.lessonIds.length;
      const unlocked = !path.prerequisitePathId || isPathCertified(path.prerequisitePathId);
      const certificate = state.certificates[pathId];
      return {
        pathId,
        completedCount: done,
        totalCount: total,
        percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
        isUnlocked: unlocked,
        isCertified: isPathCertified(pathId),
        certifiedAt: certificate?.awardedAt ?? null,
        certificateId: certificate?.certificateId ?? null,
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
    profile: state.profile,
    setProfile,
    currentPathId: state.currentPathId,
    setCurrentPathId,
    getPathProgress,
    certificates: state.certificates,
    isPathCertified,
  };

  return <GuideProgressContext.Provider value={value}>{children}</GuideProgressContext.Provider>;
}
