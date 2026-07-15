import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getOnboardingProgress,
  normalizeTeamSize,
  normalizeIndustry,
  industryLabel,
  DEFAULT_INDUSTRY,
  TOTAL_ONBOARDING_STEPS,
  normalizeTaxRateInput,
  normalizeCurrency,
  DEFAULT_CURRENCY,
} from "./onboardingHelpers.ts";

test("getOnboardingProgress maps steps 1-3 to Phase 1", () => {
  for (const step of [1, 2, 3]) {
    const progress = getOnboardingProgress(step);
    assert.equal(progress.phaseNumber, 1);
    assert.equal(progress.phaseLabel, "Getting to Know Your Business");
    assert.equal(progress.stepNumber, step);
    assert.equal(progress.totalSteps, TOTAL_ONBOARDING_STEPS);
  }
});

test("getOnboardingProgress maps later steps to their correct phase", () => {
  assert.equal(getOnboardingProgress(4).phaseNumber, 2);
  assert.equal(getOnboardingProgress(7).phaseNumber, 2);
  assert.equal(getOnboardingProgress(8).phaseNumber, 3);
  assert.equal(getOnboardingProgress(11).phaseNumber, 4);
  assert.equal(getOnboardingProgress(14).phaseNumber, 5);
  assert.equal(getOnboardingProgress(15).phaseNumber, 5);
});

test("normalizeTeamSize accepts 'just me' style answers as 1", () => {
  assert.equal(normalizeTeamSize("just me"), 1);
  assert.equal(normalizeTeamSize("Just Me"), 1);
  assert.equal(normalizeTeamSize("me"), 1);
  assert.equal(normalizeTeamSize("myself"), 1);
  assert.equal(normalizeTeamSize(""), 1);
  assert.equal(normalizeTeamSize("   "), 1);
});

test("normalizeTeamSize extracts a positive integer from free text", () => {
  assert.equal(normalizeTeamSize("3"), 3);
  assert.equal(normalizeTeamSize("about 10"), 10);
  assert.equal(normalizeTeamSize("2-3"), 2);
});

test("normalizeTeamSize falls back to 1 for unparseable or non-positive input", () => {
  assert.equal(normalizeTeamSize("nobody"), 1);
  assert.equal(normalizeTeamSize("0"), 1);
});

test("normalizeIndustry passes through a recognized key", () => {
  assert.equal(normalizeIndustry("pharmacy"), "pharmacy");
});

test("normalizeIndustry defaults unrecognized or missing input to General Retail", () => {
  assert.equal(normalizeIndustry("not_a_real_key"), DEFAULT_INDUSTRY);
  assert.equal(normalizeIndustry(null), DEFAULT_INDUSTRY);
  assert.equal(normalizeIndustry(undefined), DEFAULT_INDUSTRY);
  assert.equal(normalizeIndustry(""), DEFAULT_INDUSTRY);
});

test("industryLabel resolves known keys and falls back for unknown ones", () => {
  assert.equal(industryLabel("restaurant_cafe"), "Restaurant / Café");
  assert.equal(industryLabel("bogus"), "General Retail");
});

test("normalizeTaxRateInput clamps to 0-100 and defaults empty/unparseable input to 0", () => {
  assert.equal(normalizeTaxRateInput("8.5"), 8.5);
  assert.equal(normalizeTaxRateInput("0"), 0);
  assert.equal(normalizeTaxRateInput("100"), 100);
  assert.equal(normalizeTaxRateInput("150"), 100);
  assert.equal(normalizeTaxRateInput("-5"), 0);
  assert.equal(normalizeTaxRateInput(""), 0);
  assert.equal(normalizeTaxRateInput("not a number"), 0);
});

test("normalizeCurrency passes through a recognized key", () => {
  assert.equal(normalizeCurrency("EUR"), "EUR");
});

test("normalizeCurrency defaults unrecognized or missing input to USD", () => {
  assert.equal(normalizeCurrency("not_a_real_currency"), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency(null), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency(undefined), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency(""), DEFAULT_CURRENCY);
});
