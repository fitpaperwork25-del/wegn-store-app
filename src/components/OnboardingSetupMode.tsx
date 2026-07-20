import React, { useState } from "react";
import type { OnboardingStepData } from "../lib/onboarding/types";
import {
  getOnboardingProgress, normalizeTeamSize, normalizeIndustry, INDUSTRY_OPTIONS,
  normalizeTaxRateInput, normalizeCurrency, currencySymbolFor, CURRENCY_OPTIONS,
  WORLD_CURRENCIES, DEFAULT_CURRENCY,
} from "../lib/onboarding/onboardingHelpers";

type OnboardingSetupModeProps = {
  visible: boolean;
  businessName: string;
  currentStep: number; // 1-5 — Phase 1 only
  stepData: OnboardingStepData;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessTaxRate: number;
  onBack: (prevStep: number) => void;
  onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
  onComplete: (data: Partial<OnboardingStepData>) => void;
  onSaveBusinessProfile: (fields: { phone: string; email: string; address: string }) => void;
  onSaveTaxRate: (taxRate: number) => void;
  onSaveCurrency: (currencyCode: string, currencySymbol: string) => void;
};

const cardStyle: React.CSSProperties = {
  maxWidth: "560px", margin: "40px auto", padding: "32px",
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

const buttonRowStyle: React.CSSProperties = { display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" };

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: "none",
  borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px", background: "#fff", color: "#334155", border: "1px solid #d1d5db",
  borderRadius: "6px", fontSize: "15px", fontWeight: 500, cursor: "pointer",
};

const textBtnStyle: React.CSSProperties = {
  padding: "10px 12px", background: "none", color: "#64748b", border: "none",
  fontSize: "14px", cursor: "pointer", marginRight: "auto",
};

const fieldStyle: React.CSSProperties = { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" };

function ProgressIndicator({ step }: { step: number }) {
  const progress = getOnboardingProgress(step);
  const pct = Math.round((progress.stepNumber / progress.totalSteps) * 100);
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
        Phase {progress.phaseNumber} of 5 · Step {progress.stepNumber} of {progress.totalSteps} — {progress.phaseLabel}
      </div>
      <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#1d4ed8", borderRadius: "3px" }} />
      </div>
    </div>
  );
}

/**
 * Wegn AI Onboarding — Phase 1 (Steps 1-5 of the approved Onboarding
 * Blueprint: Welcome, Business Discovery, Industry Detection, Business
 * Profile, Tax and Currency). Renders in place of the Executive Briefing
 * inside WegnAiPage whenever a business has not yet completed onboarding.
 * Steps 6-15 are not implemented - finishing Step 5 marks onboarding
 * complete and hands off directly to the normal Executive Briefing.
 */
export function OnboardingSetupMode({
  visible, businessName, currentStep, stepData,
  businessPhone, businessEmail, businessAddress, businessTaxRate,
  onBack, onAdvance, onComplete, onSaveBusinessProfile, onSaveTaxRate, onSaveCurrency,
}: OnboardingSetupModeProps) {
  return (
    <div style={{ display: visible ? '' : 'none' }}>
      <div className="page-header">
        <h2 className="page-title">WEGN AI</h2>
        <p className="page-subtitle">Setting up {businessName || "your business"}</p>
      </div>

      {/* key={currentStep} forces each step's local field state to re-initialize fresh from stepData on every navigation (Back/Continue/resume-after-refresh) */}
      <div key={currentStep} style={cardStyle}>
        <ProgressIndicator step={currentStep} />
        {currentStep === 1 && <WelcomeStep businessName={businessName} onAdvance={onAdvance} />}
        {currentStep === 2 && <BusinessDiscoveryStep stepData={stepData} onBack={onBack} onAdvance={onAdvance} />}
        {currentStep === 3 && <IndustryDetectionStep businessName={businessName} stepData={stepData} onBack={onBack} onAdvance={onAdvance} />}
        {currentStep === 4 && (
          <BusinessProfileStep
            businessPhone={businessPhone} businessEmail={businessEmail} businessAddress={businessAddress}
            onBack={onBack} onAdvance={onAdvance} onSaveBusinessProfile={onSaveBusinessProfile}
          />
        )}
        {currentStep === 5 && (
          <TaxCurrencyStep
            businessTaxRate={businessTaxRate} stepData={stepData}
            onBack={onBack} onComplete={onComplete} onSaveTaxRate={onSaveTaxRate} onSaveCurrency={onSaveCurrency}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ businessName, onAdvance }: { businessName: string; onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void }) {
  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        Hi — I'm Wegn AI, and I'm going to help you get <strong>{businessName || "your business"}</strong> up and running.
      </p>
      <p style={{ margin: 0, fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        This usually takes about 10 minutes, and you can stop and come back anytime.
      </p>
      <div style={buttonRowStyle}>
        <button type="button" style={primaryBtnStyle} onClick={() => onAdvance({}, 2)}>Get Started</button>
      </div>
    </div>
  );
}

function BusinessDiscoveryStep({
  stepData, onBack, onAdvance,
}: {
  stepData: OnboardingStepData;
  onBack: (prevStep: number) => void;
  onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
}) {
  const [businessType, setBusinessType] = useState<"new" | "existing">(stepData.businessType ?? "new");
  const [priorSystem, setPriorSystem] = useState(stepData.priorSystem ?? "");
  const [teamSizeInput, setTeamSizeInput] = useState(stepData.teamSize ? String(stepData.teamSize) : "");

  function handleContinue() {
    onAdvance(
      {
        businessType,
        priorSystem: businessType === "existing" ? (priorSystem.trim() || null) : null,
        teamSize: normalizeTeamSize(teamSizeInput),
      },
      3
    );
  }

  function handleSkip() {
    onAdvance({ businessType: "new", priorSystem: null, teamSize: 1 }, 3);
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        Tell me a bit about your business — is this a brand-new business, or are you moving from another system?
        And roughly how many people work there, including you?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#334155" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input type="radio" name="businessType" checked={businessType === "new"} onChange={() => setBusinessType("new")} />
              This is a brand-new business
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input type="radio" name="businessType" checked={businessType === "existing"} onChange={() => setBusinessType("existing")} />
              I'm moving from another system
            </label>
          </div>
          {businessType === "existing" && (
            <input
              type="text"
              placeholder="What system were you using? (optional)"
              value={priorSystem}
              onChange={(e) => setPriorSystem(e.target.value)}
              style={{ ...fieldStyle, width: "100%", marginTop: "8px", boxSizing: "border-box" }}
            />
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>
            About how many people work there, including you?
          </label>
          <input
            type="text"
            placeholder="e.g. just me, or 3"
            value={teamSizeInput}
            onChange={(e) => setTeamSizeInput(e.target.value)}
            style={{ ...fieldStyle, width: "200px" }}
          />
        </div>
      </div>

      <div style={buttonRowStyle}>
        <button type="button" style={textBtnStyle} onClick={handleSkip}>Skip</button>
        <button type="button" style={secondaryBtnStyle} onClick={() => onBack(1)}>Back</button>
        <button type="button" style={primaryBtnStyle} onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

function IndustryDetectionStep({
  businessName, stepData, onBack, onAdvance,
}: {
  businessName: string;
  stepData: OnboardingStepData;
  onBack: (prevStep: number) => void;
  onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
}) {
  const [industry, setIndustry] = useState<string | null>(stepData.industry ?? null);

  function handleContinue() {
    onAdvance({ industry: normalizeIndustry(industry) }, 4);
  }

  function handleSkip() {
    onAdvance({ industry: normalizeIndustry(null) }, 4);
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        What kind of business is {businessName || "your business"} — a general store, a restaurant or café, a pharmacy,
        a specialty shop, or something else? This helps me set up sensible defaults, and you can always change them later.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {INDUSTRY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setIndustry(opt.key)}
            style={{
              padding: "8px 16px", borderRadius: "20px", fontSize: "14px", cursor: "pointer",
              border: industry === opt.key ? "1px solid #1d4ed8" : "1px solid #d1d5db",
              background: industry === opt.key ? "#eff6ff" : "#fff",
              color: industry === opt.key ? "#1d4ed8" : "#334155",
              fontWeight: industry === opt.key ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={buttonRowStyle}>
        <button type="button" style={textBtnStyle} onClick={handleSkip}>Skip</button>
        <button type="button" style={secondaryBtnStyle} onClick={() => onBack(2)}>Back</button>
        <button type="button" style={primaryBtnStyle} onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

function BusinessProfileStep({
  businessPhone, businessEmail, businessAddress, onBack, onAdvance, onSaveBusinessProfile,
}: {
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  onBack: (prevStep: number) => void;
  onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
  onSaveBusinessProfile: (fields: { phone: string; email: string; address: string }) => void;
}) {
  const [phone, setPhone] = useState(businessPhone);
  const [email, setEmail] = useState(businessEmail);
  const [address, setAddress] = useState(businessAddress);

  function handleContinue() {
    onSaveBusinessProfile({ phone, email, address });
    onAdvance({}, 5);
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        Now let's get your business profile set up properly — this is what shows up on your receipts and purchase
        orders. Can you give me your business address, a phone number customers or suppliers can reach you at, and
        an email if you'd like one on file?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text" placeholder="Business address (optional)" value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ ...fieldStyle, boxSizing: "border-box" }}
        />
        <input
          type="text" placeholder="Phone number (optional)" value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ ...fieldStyle, boxSizing: "border-box" }}
        />
        <input
          type="email" placeholder="Email (optional)" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...fieldStyle, boxSizing: "border-box" }}
        />
      </div>

      <div style={buttonRowStyle}>
        <button type="button" style={secondaryBtnStyle} onClick={() => onBack(3)}>Back</button>
        <button type="button" style={primaryBtnStyle} onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

function TaxCurrencyStep({
  businessTaxRate, stepData, onBack, onComplete, onSaveTaxRate, onSaveCurrency,
}: {
  businessTaxRate: number;
  stepData: OnboardingStepData;
  onBack: (prevStep: number) => void;
  onComplete: (data: Partial<OnboardingStepData>) => void;
  onSaveTaxRate: (taxRate: number) => void;
  onSaveCurrency: (currencyCode: string, currencySymbol: string) => void;
}) {
  const [taxRateInput, setTaxRateInput] = useState(String(businessTaxRate));
  const [currency, setCurrency] = useState<string | null>(stepData.currency ?? null);
  // "More currencies" starts open if the resumed/stored selection is
  // already outside the quick-pick set, so a returning user sees their
  // actual choice rather than an apparently-blank quick-pick row.
  const [showMoreCurrencies, setShowMoreCurrencies] = useState(
    () => !!stepData.currency && !CURRENCY_OPTIONS.some((opt) => opt.code === stepData.currency)
  );

  function finishCurrency(currencyCode: string) {
    const normalized = normalizeCurrency(currencyCode);
    onSaveCurrency(normalized, currencySymbolFor(normalized));
    onComplete({ currency: normalized });
  }

  function handleFinish() {
    onSaveTaxRate(normalizeTaxRateInput(taxRateInput));
    finishCurrency(currency ?? DEFAULT_CURRENCY);
  }

  function handleSkip() {
    onSaveTaxRate(0);
    finishCurrency(DEFAULT_CURRENCY);
  }

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", lineHeight: 1.6 }}>
        What tax rate should I apply at checkout — for example, 8.5%? And what currency are you pricing in — US
        dollars, or something else?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>Tax rate (%)</label>
          <input
            type="number" min="0" max="100" step="0.01" placeholder="0"
            value={taxRateInput} onChange={(e) => setTaxRateInput(e.target.value)}
            style={{ ...fieldStyle, width: "150px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>Currency</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {CURRENCY_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => { setCurrency(opt.code); setShowMoreCurrencies(false); }}
                style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: "14px", cursor: "pointer",
                  border: currency === opt.code && !showMoreCurrencies ? "1px solid #1d4ed8" : "1px solid #d1d5db",
                  background: currency === opt.code && !showMoreCurrencies ? "#eff6ff" : "#fff",
                  color: currency === opt.code && !showMoreCurrencies ? "#1d4ed8" : "#334155",
                  fontWeight: currency === opt.code && !showMoreCurrencies ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowMoreCurrencies((v) => !v)}
              style={{
                padding: "8px 16px", borderRadius: "20px", fontSize: "14px", cursor: "pointer",
                border: showMoreCurrencies ? "1px solid #1d4ed8" : "1px dashed #d1d5db",
                background: showMoreCurrencies ? "#eff6ff" : "#fff",
                color: showMoreCurrencies ? "#1d4ed8" : "#64748b",
              }}
            >
              More currencies…
            </button>
          </div>
          {showMoreCurrencies && (
            <select
              value={CURRENCY_OPTIONS.some((opt) => opt.code === currency) ? "" : (currency ?? "")}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ ...fieldStyle, marginTop: "8px", width: "260px" }}
            >
              <option value="" disabled>Select a currency…</option>
              {WORLD_CURRENCIES.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label} ({opt.code})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={buttonRowStyle}>
        <button type="button" style={textBtnStyle} onClick={handleSkip}>Skip</button>
        <button type="button" style={secondaryBtnStyle} onClick={() => onBack(4)}>Back</button>
        <button type="button" style={primaryBtnStyle} onClick={handleFinish}>Finish Setup</button>
      </div>
    </div>
  );
}
