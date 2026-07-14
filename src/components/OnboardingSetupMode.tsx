import React, { useState } from "react";
import type { OnboardingStepData } from "../lib/onboarding/types";
import { getOnboardingProgress, normalizeTeamSize, normalizeIndustry, INDUSTRY_OPTIONS } from "../lib/onboarding/onboardingHelpers";

type OnboardingSetupModeProps = {
  visible: boolean;
  businessName: string;
  currentStep: number; // 1, 2, or 3 — Phase 1 only
  stepData: OnboardingStepData;
  onBack: (prevStep: number) => void;
  onAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
  onComplete: (data: Partial<OnboardingStepData>) => void;
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
 * Wegn AI Onboarding — Phase 1 (Steps 1-3 of the approved Onboarding
 * Blueprint: Welcome, Business Discovery, Industry Detection). Renders in
 * place of the Executive Briefing inside WegnAiPage whenever a business
 * has not yet completed onboarding. Steps 4-15 are not implemented -
 * finishing Step 3 marks onboarding complete and hands off directly to the
 * normal Executive Briefing.
 */
export function OnboardingSetupMode({ visible, businessName, currentStep, stepData, onBack, onAdvance, onComplete }: OnboardingSetupModeProps) {
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
        {currentStep === 3 && <IndustryDetectionStep businessName={businessName} stepData={stepData} onBack={onBack} onComplete={onComplete} />}
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
  businessName, stepData, onBack, onComplete,
}: {
  businessName: string;
  stepData: OnboardingStepData;
  onBack: (prevStep: number) => void;
  onComplete: (data: Partial<OnboardingStepData>) => void;
}) {
  const [industry, setIndustry] = useState<string | null>(stepData.industry ?? null);

  function handleFinish() {
    onComplete({ industry: normalizeIndustry(industry) });
  }

  function handleSkip() {
    onComplete({ industry: normalizeIndustry(null) });
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
        <button type="button" style={primaryBtnStyle} onClick={handleFinish}>Finish Setup</button>
      </div>
    </div>
  );
}
