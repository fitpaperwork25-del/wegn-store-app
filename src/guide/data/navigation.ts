// Static navigation shape for the WEGN Store Interactive Guide.
// Phase 1: shell only — sectionIds map to placeholder pages, except
// "getting-started", which links to the one sample lesson built to
// prove out the reusable LessonLayout template (see lesson/).
// No backend, no CMS — this list is the entire source of truth for
// now, exactly like the rest of this app's own static configuration.

export type GuideSectionId =
  | "home"
  | "search"
  | "getting-started"
  | "daily-operations"
  | "inventory"
  | "purchasing"
  | "customers"
  | "reports"
  | "employees"
  | "settings"
  | "ai-assistant"
  | "troubleshooting"
  | "learning-progress";

export interface GuideLessonStub {
  id: string;
  title: string;
  minutes: number;
}

export interface GuideNavItem {
  id: GuideSectionId;
  label: string;
  icon: string; // key into the icon registry, see components/icons.tsx
  /** Planned lesson titles for this section — Phase 2 content, shown
   *  here only as a "coming soon" list so the shell has something
   *  real (if unimplemented) to render. */
  plannedLessons?: GuideLessonStub[];
}

export const GUIDE_NAV: GuideNavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "search", label: "Search", icon: "search" },
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "flag",
    plannedLessons: [
      { id: "sample-first-sale", title: "Ringing up your first sale", minutes: 4 },
      { id: "gs-2", title: "Touring your dashboard", minutes: 5 },
      { id: "gs-3", title: "Inviting your first staff member", minutes: 3 },
    ],
  },
  {
    id: "daily-operations",
    label: "Daily Operations",
    icon: "sun",
    plannedLessons: [
      { id: "do-1", title: "Opening and closing a shift", minutes: 5 },
      { id: "do-2", title: "Handling returns and refunds", minutes: 6 },
      { id: "do-3", title: "Cash drawer reconciliation", minutes: 7 },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "box",
    plannedLessons: [
      { id: "inv-1", title: "Adding your first product", minutes: 4 },
      { id: "inv-2", title: "Setting low-stock alerts", minutes: 3 },
      { id: "inv-3", title: "Running a stock count", minutes: 8 },
    ],
  },
  {
    id: "purchasing",
    label: "Purchasing",
    icon: "cart",
    plannedLessons: [
      { id: "pur-1", title: "Creating a purchase order", minutes: 5 },
      { id: "pur-2", title: "Receiving a supplier shipment", minutes: 6 },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: "users",
    plannedLessons: [
      { id: "cust-1", title: "Building your customer list", minutes: 4 },
      { id: "cust-2", title: "Setting up loyalty rewards", minutes: 6 },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "chart",
    plannedLessons: [
      { id: "rep-1", title: "Reading your daily summary", minutes: 5 },
      { id: "rep-2", title: "Exporting reports for your accountant", minutes: 4 },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    icon: "badge",
    plannedLessons: [
      { id: "emp-1", title: "Adding staff and setting roles", minutes: 5 },
      { id: "emp-2", title: "Tracking hours and shifts", minutes: 6 },
    ],
  },
  { id: "settings", label: "Settings", icon: "gear" },
  { id: "ai-assistant", label: "AI Assistant", icon: "spark" },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: "life-ring",
    plannedLessons: [
      { id: "ts-1", title: "Fixing a stuck receipt printer", minutes: 3 },
      { id: "ts-2", title: "What to do when the register won't scan", minutes: 3 },
    ],
  },
  { id: "learning-progress", label: "Learning Progress", icon: "trophy" },
];

/** Every lesson stub across every section, flattened once, so search
 *  and progress tracking don't each re-derive it. Only "home" and the
 *  utility sections (search/settings/ai-assistant/troubleshooting's
 *  own landing/learning-progress) are excluded, since those aren't
 *  lesson lists themselves. */
export const ALL_LESSON_STUBS: Array<GuideLessonStub & { sectionId: GuideSectionId; sectionLabel: string }> =
  GUIDE_NAV.flatMap((section) =>
    (section.plannedLessons ?? []).map((lesson) => ({
      ...lesson,
      sectionId: section.id,
      sectionLabel: section.label,
    })),
  );

export const SAMPLE_LESSON_ID = "sample-first-sale";
