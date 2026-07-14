import type { SalesTodaySummary } from "../lib/sales/salesHelpers";
import type { PriorityAlert } from "../lib/copilot/executiveBriefing";
import { deriveGreetingName } from "../lib/copilot/executiveBriefing";
import type { OnboardingStepData } from "../lib/onboarding/types";
import { CopilotChat } from "./CopilotChat";
import { OnboardingSetupMode } from "./OnboardingSetupMode";

type WegnAiPageProps = {
  visible: boolean;
  isOwnerOrManager: boolean;
  staffName: string | null;
  userEmail: string;
  businessName: string;
  salesTodaySummary: SalesTodaySummary;
  todaysProfit: number | null;
  lowStockCount: number;
  outOfStockCount: number;
  drawerOpen: boolean;
  drawerOpenedAt: string | null;
  priorityAlerts: PriorityAlert[];
  onNavigate: (tab: string) => void;
  employeeId: string | null;
  /** Wegn AI Onboarding Blueprint, Phase 1 (Steps 1-3). onboardingLoaded=false renders nothing yet, matching the businessLoaded guard pattern used elsewhere in App.tsx — avoids flashing the wrong mode before the state is known. */
  onboardingLoaded: boolean;
  onboardingCompleted: boolean;
  onboardingCurrentStep: number;
  onboardingStepData: OnboardingStepData;
  onOnboardingBack: (prevStep: number) => void;
  onOnboardingAdvance: (data: Partial<OnboardingStepData>, nextStep: number) => void;
  onOnboardingComplete: (data: Partial<OnboardingStepData>) => void;
};

/**
 * The Wegn AI workspace. Wegn AI always speaks first: the Executive
 * Briefing below is what the user sees immediately - not an empty chat,
 * not a greeting placeholder. The briefing itself is a plain, fast summary
 * of data already visible elsewhere in the app (Dashboard, Inventory,
 * Reports); only the "Ask Wegn AI" input at the bottom uses the actual AI
 * tool-calling flow (CopilotChat, unchanged from Foundation Milestone 1).
 */
export function WegnAiPage({
  visible,
  isOwnerOrManager,
  staffName,
  userEmail,
  businessName,
  salesTodaySummary,
  todaysProfit,
  lowStockCount,
  outOfStockCount,
  drawerOpen,
  drawerOpenedAt,
  priorityAlerts,
  onNavigate,
  employeeId,
  onboardingLoaded,
  onboardingCompleted,
  onboardingCurrentStep,
  onboardingStepData,
  onOnboardingBack,
  onOnboardingAdvance,
  onOnboardingComplete,
}: WegnAiPageProps) {
  const greetingName = deriveGreetingName(staffName, userEmail);
  const inventoryHealthy = lowStockCount === 0 && outOfStockCount === 0;

  if (!onboardingLoaded) return <div style={{ display: visible ? '' : 'none' }} />;

  if (!onboardingCompleted) {
    return (
      <OnboardingSetupMode
        visible={visible}
        businessName={businessName}
        currentStep={onboardingCurrentStep}
        stepData={onboardingStepData}
        onBack={onOnboardingBack}
        onAdvance={onOnboardingAdvance}
        onComplete={onOnboardingComplete}
      />
    );
  }

  return (
    <div style={{ display: visible ? '' : 'none' }}>
      <div className="page-header">
        <h2 className="page-title">WEGN AI</h2>
        <p className="page-subtitle">Good Morning, {greetingName}</p>
      </div>

      {/* ── Overall Store Health ── */}
      <div className="section-card" style={{ marginBottom: "20px" }}>
        <h3 className="section-card-title">Overall Store Health</h3>
        <div className="dash-card-row">
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>$</div>
            <div className="dash-card-body">
              <div className="dash-card-label">Today's Sales</div>
              <div className="dash-card-value">${salesTodaySummary.revenueToday.toFixed(2)}</div>
              <div className="dash-card-helper">{salesTodaySummary.txnCount} transaction{salesTodaySummary.txnCount === 1 ? "" : "s"}</div>
            </div>
          </div>

          {isOwnerOrManager && (
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>&#x1F4B0;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Today's Profit</div>
                <div className="dash-card-value">{todaysProfit === null ? "—" : `$${todaysProfit.toFixed(2)}`}</div>
                <div className="dash-card-helper">{todaysProfit === null ? "No cost data yet" : "Estimated"}</div>
              </div>
            </div>
          )}

          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: inventoryHealthy ? "#f0fdf4" : "#fef2f2", color: inventoryHealthy ? "#16a34a" : "#dc2626" }}>&#x1F4E6;</div>
            <div className="dash-card-body">
              <div className="dash-card-label">Inventory Health</div>
              <div className="dash-card-value" style={inventoryHealthy ? undefined : { color: "#dc2626" }}>
                {inventoryHealthy ? "All Good" : `${lowStockCount} to review`}
              </div>
              <div className="dash-card-helper">{outOfStockCount} out of stock · {lowStockCount - outOfStockCount} low</div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: drawerOpen ? "#f0fdf4" : "#f1f5f9", color: drawerOpen ? "#16a34a" : "#64748b" }}>&#x1F5C4;</div>
            <div className="dash-card-body">
              <div className="dash-card-label">Cash Drawer</div>
              <div className="dash-card-value">{drawerOpen ? "OPEN" : "CLOSED"}</div>
              <div className="dash-card-helper">
                {drawerOpen && drawerOpenedAt ? `Since ${new Date(drawerOpenedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active session"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Priority Alerts ── */}
      <div className="section-card" style={{ marginBottom: "20px" }}>
        <h3 className="section-card-title">Priority Alerts</h3>
        {priorityAlerts.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Nothing needs attention right now.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {priorityAlerts.map((alert) => (
              <li key={alert.id} style={{ fontSize: "14px", color: alert.severity === "high" ? "#b91c1c" : "#334155" }}>
                {alert.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Recommended Actions ── */}
      <div className="section-card" style={{ marginBottom: "20px" }}>
        <h3 className="section-card-title">Recommended Actions</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => onNavigate("inventory")} className="sh-btn sh-btn-print">Review Low Stock</button>
          <button type="button" onClick={() => onNavigate("inventory")} className="sh-btn sh-btn-print">Review Expiring Inventory</button>
          <button type="button" onClick={() => onNavigate("purchasing")} className="sh-btn sh-btn-print">Review Supplier Payments</button>
        </div>
      </div>

      {/* ── Ask Wegn AI ── */}
      <div className="section-card">
        <h3 className="section-card-title">Ask Wegn AI</h3>
        <CopilotChat visible={true} employeeId={employeeId} />
      </div>
    </div>
  );
}
