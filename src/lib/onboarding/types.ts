/**
 * Wegn AI Onboarding — Phase 1 data shapes only (Steps 1-5: Welcome,
 * Business Discovery, Industry Detection, Business Profile, Tax and
 * Currency). Extended as later phases of the approved Onboarding Blueprint
 * are implemented.
 */

export type OnboardingStepData = {
  businessType?: "new" | "existing";
  priorSystem?: string | null;
  teamSize?: number;
  industry?: string;
  /** Step 5 only. Not yet backed by a real businesses.currency column - see
   *  the blueprint's grounding note. Recorded here, same as the other
   *  fields above, until a real column exists. */
  currency?: string;
};

export type OnboardingState = {
  businessId: string;
  completed: boolean;
  currentStep: number;
  stepData: OnboardingStepData;
};
