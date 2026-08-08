// Context object + consumer hook live in their own (non-component)
// module so GuideProgressContext.tsx can stay component-only — keeps
// Fast Refresh working there instead of tripping
// react-refresh/only-export-components by mixing a component export
// with a hook export in the same file.

import { createContext, useContext } from "react";
import type { GuideSectionId } from "../data/navigation";
import type { AcademyLevel } from "../data/levels";

export interface PathProgress {
  pathId: string;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  isUnlocked: boolean;
  isCertified: boolean;
  certifiedAt: string | null;
}

export interface GuideProgressValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  completedLessonIds: Set<string>;
  isLessonComplete: (lessonId: string) => boolean;
  markLessonComplete: (lessonId: string) => void;
  markLessonIncomplete: (lessonId: string) => void;
  /** A lesson with no prerequisite is always unlocked; one with a
   *  prerequisiteLessonId (see data/navigation.ts) unlocks once that
   *  lesson has been completed. Purely derived from completedLessonIds
   *  — nothing extra to persist. */
  isLessonUnlocked: (lessonId: string) => boolean;
  bookmarkedLessonIds: Set<string>;
  isBookmarked: (lessonId: string) => boolean;
  toggleBookmark: (lessonId: string) => void;
  earnedBadgeIds: Set<string>;
  hasBadge: (badgeId: string) => boolean;
  awardBadge: (badgeId: string) => void;
  lastSectionId: GuideSectionId | null;
  setLastSectionId: (id: GuideSectionId) => void;
  totalLessons: number;
  completedCount: number;
  lessonsRemaining: number;
  percentComplete: number;

  /** Estimated minutes invested, summing the `minutes` of every
   *  completed lesson — the only honest "time spent" figure available
   *  without a real running timer. */
  timeSpentMinutes: number;
  level: AcademyLevel;

  /** yyyy-mm-dd of the last day a lesson was completed, and the
   *  resulting consecutive-day streak. Updated automatically by
   *  markLessonComplete. */
  lastActiveDate: string | null;
  currentStreak: number;
  longestStreak: number;

  userRole: string | null;
  setUserRole: (roleId: string) => void;
  learnerName: string;
  setLearnerName: (name: string) => void;

  currentPathId: string | null;
  setCurrentPathId: (pathId: string | null) => void;
  getPathProgress: (pathId: string) => PathProgress;

  /** pathId -> ISO date the certificate was earned. Awarded
   *  automatically the moment every lesson in a path is complete —
   *  see GuideProgressContext's completion effect. */
  certificates: Record<string, string>;
  isPathCertified: (pathId: string) => boolean;
}

export const GuideProgressContext = createContext<GuideProgressValue | null>(null);

export function useGuideProgress(): GuideProgressValue {
  const ctx = useContext(GuideProgressContext);
  if (!ctx) throw new Error("useGuideProgress must be used within GuideProgressProvider");
  return ctx;
}
