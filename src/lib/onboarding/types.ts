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
  /** Step 5 only. Mirrors what was saved to businesses.currency_code (see
   *  App.tsx's handleOnboardingSaveCurrency) - kept here too so a resumed
   *  session (Back button, or reopening after leaving mid-step) can show
   *  the previously selected value without an extra fetch. */
  currency?: string;
};

export type OnboardingState = {
  businessId: string;
  completed: boolean;
  currentStep: number;
  stepData: OnboardingStepData;
};
