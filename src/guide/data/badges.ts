// Achievement badges awarded by lessons. Purely cosmetic/motivational
// state stored via GuideProgressContext (localStorage) — no backend,
// no account tying. A lesson awards a badge by id via awardBadge();
// this file is the single source of truth for what that id looks like.

import type { GuideIconName } from "../components/icons";

export interface GuideBadge {
  id: string;
  name: string;
  description: string;
  icon: GuideIconName;
}

export const GUIDE_BADGES: GuideBadge[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Completed your first lesson in WEGN Store Academy.",
    icon: "flag",
  },
  {
    id: "drawer-opener",
    name: "Drawer Opener",
    description: "Learned how to open the cash drawer to start a shift.",
    icon: "box",
  },
  {
    id: "first-sale",
    name: "First Sale",
    description: "Rang up a complete sale from start to finish.",
    icon: "cart",
  },
  {
    id: "scan-master",
    name: "Scan Master",
    description: "Learned to scan items quickly and accurately.",
    icon: "search",
  },
  {
    id: "search-pro",
    name: "Search Pro",
    description: "Found products fast without a barcode in hand.",
    icon: "grid",
  },
  {
    id: "discount-decider",
    name: "Discount Decider",
    description: "Applied discounts the right way, every time.",
    icon: "gear",
  },
  {
    id: "payment-pro",
    name: "Payment Pro",
    description: "Comfortable taking card, cash, and split payments.",
    icon: "badge",
  },
  {
    id: "receipt-runner",
    name: "Receipt Runner",
    description: "Printed and emailed receipts without a hitch.",
    icon: "receipt",
  },
  {
    id: "hold-and-resume",
    name: "Hold & Resume",
    description: "Suspended a sale and picked it back up later.",
    icon: "moon",
  },
  {
    id: "return-specialist",
    name: "Return Specialist",
    description: "Processed a return the right way, every step.",
    icon: "life-ring",
  },
  {
    id: "drawer-closer",
    name: "Drawer Closer",
    description: "Closed out the cash drawer at the end of a shift.",
    icon: "box",
  },
  {
    id: "sale-detective",
    name: "Sale Detective",
    description: "Found any past sale fast using search and filters.",
    icon: "search",
  },
  {
    id: "void-master",
    name: "Void Master",
    description: "Knows when — and how — to void a sale correctly.",
    icon: "close",
  },
  {
    id: "catalog-builder",
    name: "Catalog Builder",
    description: "Added a product with accurate pricing and stock.",
    icon: "box",
  },
  {
    id: "stock-watcher",
    name: "Stock Watcher",
    description: "Set reorder levels so low stock never sneaks up.",
    icon: "grid",
  },
  {
    id: "count-champion",
    name: "Count Champion",
    description: "Ran a full stock count from start to confirm.",
    icon: "check",
  },
  {
    id: "po-creator",
    name: "PO Creator",
    description: "Built a purchase order from scratch.",
    icon: "receipt",
  },
  {
    id: "receiving-pro",
    name: "Receiving Pro",
    description: "Received a supplier shipment accurately.",
    icon: "cart",
  },
  {
    id: "customer-builder",
    name: "Customer Builder",
    description: "Added a customer and found them again at checkout.",
    icon: "users",
  },
  {
    id: "loyalty-pro",
    name: "Loyalty Pro",
    description: "Knows exactly how points are earned and redeemed.",
    icon: "spark",
  },
  {
    id: "report-reader",
    name: "Report Reader",
    description: "Reads Sales Analytics like a second language.",
    icon: "chart",
  },
  {
    id: "inventory-analyst",
    name: "Inventory Analyst",
    description: "Reviewed inventory valuation and stock reports.",
    icon: "grid",
  },
  {
    id: "staff-builder",
    name: "Staff Builder",
    description: "Added a staff member with the right role.",
    icon: "badge",
  },
  {
    id: "role-expert",
    name: "Role Expert",
    description: "Knows exactly what each staff role can access.",
    icon: "gear",
  },
  {
    id: "printer-fixer",
    name: "Printer Fixer",
    description: "Recovered a receipt when the printer wouldn't cooperate.",
    icon: "life-ring",
  },
  {
    id: "scan-troubleshooter",
    name: "Scan Troubleshooter",
    description: "Resolved an unmatched barcode without missing a beat.",
    icon: "search",
  },
];

export function getBadge(badgeId: string): GuideBadge | undefined {
  return GUIDE_BADGES.find((b) => b.id === badgeId);
}
