// Content shape for the "onboarding tour" lesson template — the
// pattern introduced by Lesson 1 ("Welcome to WEGN Store") and meant
// to be reused by every future lesson of this kind. A lesson is just
// a value of this type; OnboardingLessonLayout is the only thing that
// knows how to turn it into screens.

import type { GuideIconName } from "../../components/icons";
import type { GuideSectionId } from "../../data/navigation";
import type { LessonQuizQuestion } from "../types";

export interface PlatformTourStop {
  id: string;
  label: string;
  icon: GuideIconName;
  description: string;
}

export interface QuickChallengeStep {
  id: string;
  instruction: string;
  /** If set, this step is completed by visiting that platform-tour
   *  stop in the simulated nav. If unset, it's a standalone action
   *  (e.g. the final "mark lesson complete" button). */
  targetStopId?: string;
}

export interface OnboardingLessonContent {
  id: string;
  sectionId: GuideSectionId;
  title: string;
  minutes: number;
  welcome: {
    intro: string;
    problems: string[];
    youWillLearn: string[];
  };
  platformTour: PlatformTourStop[];
  quickChallenge: {
    intro: string;
    steps: QuickChallengeStep[];
  };
  knowledgeCheck: LessonQuizQuestion[];
  completion: {
    badgeId: string;
    message: string;
    nextLesson: { sectionId: GuideSectionId; lessonId: string; title: string } | null;
  };
}

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Platform Tour",
  "Walkthrough",
  "Quick Challenge",
  "Knowledge Check",
  "Complete",
] as const;
