// Shape of a lesson's content, independent of how it's rendered.
// Phase 1 defines this contract and one hand-authored example
// (sample-first-sale) so Phase 2 can add real lessons as plain data
// without touching LessonLayout or any section component.

export interface LessonCallout {
  label: string; // short number/letter shown in the dot, e.g. "1"
  title: string;
  description: string;
}

export interface LessonPracticeStep {
  title: string;
  description: string;
}

export interface LessonTip {
  text: string;
}

export interface LessonQuizOption {
  text: string;
  correct: boolean;
}

export interface LessonQuizQuestion {
  question: string;
  options: LessonQuizOption[];
  explanation: string;
}

export interface LessonContent {
  id: string;
  sectionId: string;
  title: string;
  minutes: number;
  /** Awarded via awardBadge() when the lesson is marked complete —
   *  see data/badges.ts. Optional so older/simpler lessons don't need
   *  one. */
  badgeId?: string;
  overview: {
    /** Short "learning objectives" bullets shown above the summary. */
    objectives: string[];
    summary: string;
    whyItMatters: string;
  };
  walkthrough: {
    screenLabel: string;
    callouts: LessonCallout[];
  };
  practice: {
    intro: string;
    steps: LessonPracticeStep[];
  };
  tips: {
    good: LessonTip[];
    watchOutFor: LessonTip[];
  };
  quiz: LessonQuizQuestion[];
  nextLesson: {
    lessonId: string | null;
    sectionId: string;
    title: string;
  } | null;
}
