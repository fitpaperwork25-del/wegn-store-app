// Static navigation shape for the WEGN Store Interactive Guide.
// sectionIds map to placeholder ("coming soon") pages by default;
// lessons flip to real content by setting `implemented: true` and
// getting a case in GuideApp's lesson router. No backend, no CMS —
// this list is the entire source of truth for now, exactly like the
// rest of this app's own static configuration.

export type GuideSectionId =
  | "home"
  | "search"
  | "learning-paths"
  | "achievements"
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
  { id: "learning-paths", label: "Learning Paths", icon: "compass" },
  { id: "achievements", label: "Achievements", icon: "trophy" },
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
        title: "Finding a Product Without a Barcode",
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
        id: "processing-return",
        title: "Processing a Return",
        minutes: 5,
        implemented: true,
        prerequisiteLessonId: "printing-receipt",
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
    // Opening/closing the drawer and processing returns are taught in
    // the Getting Started Academy sequence; these two cover the rest
    // of what Sales History is for day to day.
    plannedLessons: [
      { id: "do-1", title: "Looking Up a Past Sale", minutes: 3, implemented: true },
      { id: "do-2", title: "Voiding a Sale", minutes: 3, implemented: true, prerequisiteLessonId: "do-1" },
      { id: "do-3", title: "Understanding Your Dashboard", minutes: 4, implemented: true, prerequisiteLessonId: "do-2" },
      { id: "do-4", title: "Cash Drawer Reports & Paid Outs", minutes: 4, implemented: true, prerequisiteLessonId: "do-3" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "box",
    plannedLessons: [
      { id: "inv-1", title: "Adding your first product", minutes: 4, implemented: true },
      { id: "inv-2", title: "Setting low-stock alerts", minutes: 3, implemented: true, prerequisiteLessonId: "inv-1" },
      { id: "inv-3", title: "Running a stock count", minutes: 8, implemented: true, prerequisiteLessonId: "inv-2" },
      { id: "inv-4", title: "Editing, Deactivating, and Organizing Products", minutes: 5, implemented: true, prerequisiteLessonId: "inv-3" },
      { id: "inv-5", title: "Printing Barcode Labels", minutes: 3, implemented: true, prerequisiteLessonId: "inv-4" },
      { id: "inv-6", title: "Running a Receiving Session", minutes: 6, implemented: true, prerequisiteLessonId: "inv-5" },
      { id: "inv-7", title: "Rapid Receive & Smart Receive", minutes: 4, implemented: true, prerequisiteLessonId: "inv-6" },
      { id: "inv-8", title: "Receiving History, Invoices & Supplier Linking", minutes: 5, implemented: true, prerequisiteLessonId: "inv-7" },
      { id: "inv-9", title: "Bulk Importing Products via CSV", minutes: 5, implemented: true, prerequisiteLessonId: "inv-8" },
      { id: "inv-10", title: "Investigating Transaction History", minutes: 4, implemented: true, prerequisiteLessonId: "inv-9" },
      { id: "inv-11", title: "Expiration & Batch Tracking", minutes: 5, implemented: true, prerequisiteLessonId: "inv-10" },
      { id: "inv-12", title: "Adjusting Inventory", minutes: 4, implemented: true, prerequisiteLessonId: "inv-11" },
    ],
  },
  {
    id: "purchasing",
    label: "Purchasing",
    icon: "cart",
    plannedLessons: [
      { id: "pur-1", title: "Creating a purchase order", minutes: 5, implemented: true },
      { id: "pur-2", title: "Receiving a supplier shipment", minutes: 6, implemented: true, prerequisiteLessonId: "pur-1" },
      { id: "pur-3", title: "Managing Suppliers", minutes: 5, implemented: true, prerequisiteLessonId: "pur-2" },
      { id: "pur-4", title: "Canceling, Printing, and Signing POs; Supplier Statements", minutes: 6, implemented: true, prerequisiteLessonId: "pur-3" },
      { id: "pur-5", title: "Bulk Reordering with Smart Purchase Planning", minutes: 5, implemented: true, prerequisiteLessonId: "pur-4" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: "users",
    plannedLessons: [
      { id: "cust-1", title: "Building your customer list", minutes: 4, implemented: true },
      // Retitled from "Setting up loyalty rewards" — there's no setup
      // screen in WEGN Store, loyalty is automatic; the accurate title
      // teaches what actually exists (see sectionLessons.ts).
      { id: "cust-2", title: "Loyalty Points at Checkout", minutes: 5, implemented: true, prerequisiteLessonId: "cust-1" },
      { id: "cust-3", title: "Editing and Deactivating Customers", minutes: 4, implemented: true, prerequisiteLessonId: "cust-2" },
      { id: "cust-4", title: "Customer Insights & Purchase History", minutes: 4, implemented: true, prerequisiteLessonId: "cust-3" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "chart",
    plannedLessons: [
      { id: "rep-1", title: "Reading your daily summary", minutes: 5, implemented: true },
      // Retitled from "Exporting reports for your accountant" — no
      // export/download exists for sales reports; Inventory Reports
      // (valuation, low stock, PO, returns) is the real second half
      // of the Reports tab.
      { id: "rep-2", title: "Reviewing Inventory Reports", minutes: 4, implemented: true, prerequisiteLessonId: "rep-1" },
      { id: "rep-3", title: "Understanding the Profit Report", minutes: 5, implemented: true, prerequisiteLessonId: "rep-2" },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    icon: "badge",
    plannedLessons: [
      { id: "emp-1", title: "Adding staff and setting roles", minutes: 5, implemented: true },
      // Retitled from "Tracking hours and shifts" — no timesheet
      // feature exists; role-based tab access is the real, valuable
      // second employee topic.
      { id: "emp-2", title: "Understanding Staff Roles & Permissions", minutes: 4, implemented: true, prerequisiteLessonId: "emp-1" },
      { id: "emp-3", title: "Editing and Deactivating Staff", minutes: 4, implemented: true, prerequisiteLessonId: "emp-2" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "gear",
    plannedLessons: [
      { id: "settings-1", title: "Configuring Your Business Profile", minutes: 5, implemented: true },
      { id: "settings-2", title: "Registering Devices & Receipt Settings", minutes: 4, implemented: true, prerequisiteLessonId: "settings-1" },
    ],
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: "spark",
    plannedLessons: [
      { id: "ai-1", title: "Reading the Executive Briefing", minutes: 4, implemented: true },
      { id: "ai-2", title: "Asking Wegn AI", minutes: 5, implemented: true, prerequisiteLessonId: "ai-1" },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: "life-ring",
    plannedLessons: [
      { id: "ts-1", title: "Fixing a stuck receipt printer", minutes: 3, implemented: true },
      { id: "ts-2", title: "What to do when the register won't scan", minutes: 3, implemented: true, prerequisiteLessonId: "ts-1" },
      { id: "ts-3", title: "Resolving an Unmatched Product While Receiving", minutes: 3, implemented: true, prerequisiteLessonId: "ts-2" },
    ],
  },
  { id: "learning-progress", label: "Learning Progress", icon: "trophy" },
];

/** Every lesson stub across every section, flattened once, so search
 *  and progress tracking don't each re-derive it. Only the sections
 *  with no plannedLessons array at all (home, search, achievements,
 *  learning-progress — pure utility pages, not lesson lists) are
 *  excluded. */
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
