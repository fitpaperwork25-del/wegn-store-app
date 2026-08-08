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
  certificateId: string | null;
}

/** One awarded certificate: when, and its stable, unique id (see
 *  GuideProgressContext's generateCertificateId). */
export interface CertificateRecord {
  awardedAt: string;
  certificateId: string;
}

/** Every kind of person the Academy can certify. Not every learner is
 *  a store employee — this is what lets a Partner or Promoter get a
 *  real, correctly-labeled certificate with zero code changes: they
 *  just fill in this same profile with role "partner"/"promoter". */
export type AcademyProfileRole = "owner" | "staff" | "partner" | "promoter" | "trainer" | "other";

export const ACADEMY_PROFILE_ROLE_LABELS: Record<AcademyProfileRole, string> = {
  owner: "Business Owner",
  staff: "Staff Member",
  partner: "Partner",
  promoter: "Promoter",
  trainer: "Trainer",
  other: "Learner",
};

/** The Academy's own learner profile — independent of the Store's
 *  employees/businesses tables. Auto-suggested where real Store data
 *  exists (see lib/identity.ts) but always self-owned and editable,
 *  since a Partner or Promoter has no Store record to resolve from at
 *  all. This — not any Store table — is what a certificate renders. */
export interface AcademyProfile {
  fullName: string;
  email: string;
  organization: string;
  role: AcademyProfileRole;
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

  /** The Academy's own learner profile (see AcademyProfile) — what
   *  every certificate actually renders. Auto-suggested once from
   *  Supabase where real Store data exists (lib/identity.ts), then
   *  fully owned by the learner from that point on. */
  profile: AcademyProfile;
  setProfile: (patch: Partial<AcademyProfile>) => void;

  currentPathId: string | null;
  setCurrentPathId: (pathId: string | null) => void;
  getPathProgress: (pathId: string) => PathProgress;

  /** pathId -> when and under what id the certificate was earned.
   *  Awarded automatically the moment every lesson in a path is
   *  complete — see GuideProgressContext's completion effect. */
  certificates: Record<string, CertificateRecord>;
  isPathCertified: (pathId: string) => boolean;
}

export const GuideProgressContext = createContext<GuideProgressValue | null>(null);

export function useGuideProgress(): GuideProgressValue {
  const ctx = useContext(GuideProgressContext);
  if (!ctx) throw new Error("useGuideProgress must be used within GuideProgressProvider");
  return ctx;
}
