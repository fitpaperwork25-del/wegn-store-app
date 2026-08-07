// Context object + consumer hook live in their own (non-component)
// module so GuideProgressContext.tsx can stay component-only — keeps
// Fast Refresh working there instead of tripping
// react-refresh/only-export-components by mixing a component export
// with a hook export in the same file.

import { createContext, useContext } from "react";
import type { GuideSectionId } from "../data/navigation";

export interface GuideProgressValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  completedLessonIds: Set<string>;
  isLessonComplete: (lessonId: string) => boolean;
  markLessonComplete: (lessonId: string) => void;
  markLessonIncomplete: (lessonId: string) => void;
  bookmarkedLessonIds: Set<string>;
  isBookmarked: (lessonId: string) => boolean;
  toggleBookmark: (lessonId: string) => void;
  lastSectionId: GuideSectionId | null;
  setLastSectionId: (id: GuideSectionId) => void;
  totalLessons: number;
  completedCount: number;
  percentComplete: number;
}

export const GuideProgressContext = createContext<GuideProgressValue | null>(null);

export function useGuideProgress(): GuideProgressValue {
  const ctx = useContext(GuideProgressContext);
  if (!ctx) throw new Error("useGuideProgress must be used within GuideProgressProvider");
  return ctx;
}
