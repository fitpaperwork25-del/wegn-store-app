// Static navigation shape for the WEGN Store Interactive Guide.
// sectionIds map to placeholder ("coming soon") pages by default;
// lessons flip to real content by setting `implemented: true` and
// getting a case in GuideApp's lesson router. No backend, no CMS —
// this list is the entire source of truth for now, exactly like the
// rest of this app's own static configuration.

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
  /** True once a real lesson page exists for this id (see GuideApp's
   *  lesson router). Everything else renders as a labeled "coming
   *  soon" row instead of a dead or fake link. */
  implemented?: boolean;
  /** If set, this lesson stays locked until the referenced lesson id
   *  has been marked complete. Lessons with no prerequisite are
   *  always unlocked. */
  prerequisiteLessonId?: string;
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
    // The WEGN Store Academy: a single continuous curriculum. Each
    // lesson unlocks the next automatically via prerequisiteLessonId
    // once marked complete — see GuideProgressContext.isLessonUnlocked.
    plannedLessons: [
      { id: "welcome-to-wegn-store", title: "Welcome to WEGN Store", minutes: 5, implemented: true },
      {
        id: "opening-cash-drawer",
        title: "Opening the Cash Drawer",
        minutes: 3,
        implemented: true,
        prerequisiteLessonId: "welcome-to-wegn-store",
      },
      {
        id: "sample-first-sale",
        title: "Ringing up your first sale",
        minutes: 4,
        implemented: true,
        prerequisiteLessonId: "opening-cash-drawer",
      },
      {
        id: "barcode-scanning",
        title: "Barcode Scanning",
        minutes: 3,
        implemented: true,
        prerequisiteLessonId: "sample-first-sale",
      },
      {
        id: "product-search",
        title: "Product Search",
        minutes: 3,
        implemented: true,
        prerequisiteLessonId: "barcode-scanning",
      },
      {
        id: "applying-discounts",
        title: "Applying Discounts",
        minutes: 4,
        implemented: true,
        prerequisiteLessonId: "product-search",
      },
      {
        id: "payment-methods",
        title: "Accepting Different Payment Methods",
        minutes: 4,
        implemented: true,
        prerequisiteLessonId: "applying-discounts",
      },
      {
        id: "printing-receipt",
        title: "Printing a Receipt",
        minutes: 3,
        implemented: true,
        prerequisiteLessonId: "payment-methods",
      },
      {
        id: "suspend-resume-sale",
        title: "Suspending and Resuming a Sale",
        minutes: 4,
        implemented: true,
        prerequisiteLessonId: "printing-receipt",
      },
      {
        id: "processing-return",
        title: "Processing a Return",
        minutes: 5,
        implemented: true,
        prerequisiteLessonId: "suspend-resume-sale",
      },
      {
        id: "closing-cash-drawer",
        title: "Closing the Cash Drawer",
        minutes: 3,
        implemented: true,
        prerequisiteLessonId: "processing-return",
      },
      {
        id: "gs-3",
        title: "Inviting your first staff member",
        minutes: 3,
        prerequisiteLessonId: "closing-cash-drawer",
      },
    ],
  },
  {
    id: "daily-operations",
    label: "Daily Operations",
    icon: "sun",
    // Opening/closing the drawer and processing returns are now
    // taught in the Getting Started Academy sequence above — no
    // separate stubs duplicating that ground here.
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

/** Ids of every lesson that has real content behind it (see GuideApp's
 *  lesson router). Everything else in ALL_LESSON_STUBS is a titled
 *  stub — checking membership here is how pages decide whether a
 *  lesson row is clickable or a "coming soon" placeholder. */
export const IMPLEMENTED_LESSON_IDS = new Set(
  ALL_LESSON_STUBS.filter((l) => l.implemented).map((l) => l.id),
);

/** The very first lesson in the guide — used as the default "start
 *  learning" call to action wherever one is needed (Home page, etc). */
export const FIRST_LESSON_ID = "welcome-to-wegn-store";
