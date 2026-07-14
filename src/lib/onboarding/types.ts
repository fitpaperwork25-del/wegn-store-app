/**
 * Wegn AI Onboarding — Phase 1 data shapes only (Steps 1-3: Welcome,
 * Business Discovery, Industry Detection). Extended as later phases of the
 * approved Onboarding Blueprint are implemented.
 */

export type OnboardingStepData = {
  businessType?: "new" | "existing";
  priorSystem?: string | null;
  teamSize?: number;
  industry?: string;
};

export type OnboardingState = {
  businessId: string;
  completed: boolean;
  currentStep: number;
  stepData: OnboardingStepData;
};
