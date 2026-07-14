/**
 * Pure, stateless helpers for Wegn AI Onboarding — Phase 1 (Steps 1-3
 * only). Same convention as every other lib/<domain>/*Helpers.ts module in
 * this codebase: no Supabase, no React state.
 */

export const TOTAL_ONBOARDING_STEPS = 15;

const PHASE_LABELS: Record<number, string> = {
  1: "Getting to Know Your Business",
  2: "Setting Up Your Business",
  3: "Building Your Catalog",
  4: "Getting Ready to Sell",
  5: "You're Live",
};

/** Which of the 5 blueprint phases a step number belongs to. Only Phase 1 (steps 1-3) is implemented so far. */
function getPhaseForStep(step: number): number {
  if (step <= 3) return 1;
  if (step <= 7) return 2;
  if (step <= 10) return 3;
  if (step <= 13) return 4;
  return 5;
}

export type OnboardingProgress = {
  phaseNumber: number;
  phaseLabel: string;
  stepNumber: number;
  totalSteps: number;
};

export function getOnboardingProgress(step: number): OnboardingProgress {
  const phaseNumber = getPhaseForStep(step);
  return {
    phaseNumber,
    phaseLabel: PHASE_LABELS[phaseNumber],
    stepNumber: step,
    totalSteps: TOTAL_ONBOARDING_STEPS,
  };
}

/**
 * Business Discovery (Step 2) team-size validation rule from the approved
 * blueprint: "team size resolves to a positive integer or a recognizable
 * range... non-numeric answers like 'just me' are accepted and normalized
 * to 1." Always returns a valid positive integer — this field never blocks.
 */
export function normalizeTeamSize(raw: string): number {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === "just me" || trimmed === "me" || trimmed === "myself") return 1;
  const match = trimmed.match(/\d+/);
  if (!match) return 1;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export type IndustryOption = { key: string; label: string };

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { key: "general_retail", label: "General Retail" },
  { key: "restaurant_cafe", label: "Restaurant / Café" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "grocery", label: "Grocery" },
  { key: "specialty_other", label: "Specialty / Other" },
];

export const DEFAULT_INDUSTRY = "general_retail";

/** Industry Detection (Step 3) default rule: any unrecognized/skipped answer maps to General Retail. */
export function normalizeIndustry(key: string | null | undefined): string {
  if (!key) return DEFAULT_INDUSTRY;
  return INDUSTRY_OPTIONS.some((opt) => opt.key === key) ? key : DEFAULT_INDUSTRY;
}

export function industryLabel(key: string): string {
  return INDUSTRY_OPTIONS.find((opt) => opt.key === key)?.label ?? "General Retail";
}
