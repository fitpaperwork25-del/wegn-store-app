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
    description: "Learned to scan items quickly and resolve an unmatched barcode.",
    icon: "search",
  },
  {
    id: "search-pro",
    name: "Search Pro",
    description: "Knows how to add a product with the POS picker when there's no barcode to scan.",
    icon: "grid",
  },
  {
    id: "discount-decider",
    name: "Discount Decider",
    description: "Knows when to use Negotiate vs. a cart-wide discount, and how to clear one.",
    icon: "gear",
  },
  {
    id: "payment-pro",
    name: "Payment Pro",
    description: "Knows every payment method WEGN Store supports and how cash change is calculated.",
    icon: "badge",
  },
  {
    id: "receipt-runner",
    name: "Receipt Runner",
    description: "Printed and reprinted receipts confidently.",
    icon: "receipt",
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
  {
    id: "dashboard-reader",
    name: "Dashboard Reader",
    description: "Knows what a Cashier's Dashboard shows vs. an Owner/Manager's.",
    icon: "grid",
  },
  {
    id: "drawer-reporter",
    name: "Drawer Reporter",
    description: "Recorded a paid out and read the End-of-Day Summary.",
    icon: "box",
  },
  {
    id: "catalog-curator",
    name: "Catalog Curator",
    description: "Edited, deactivated, and organized products with confidence.",
    icon: "box",
  },
  {
    id: "label-printer",
    name: "Label Printer",
    description: "Printed a barcode label and knows what barcode lookup really checks.",
    icon: "receipt",
  },
  {
    id: "supplier-manager",
    name: "Supplier Manager",
    description: "Manages the supplier list — add, edit, deactivate, and knows the delete rule.",
    icon: "users",
  },
  {
    id: "po-lifecycle-pro",
    name: "PO Lifecycle Pro",
    description: "Knows how to cancel, print, email, and sign a purchase order.",
    icon: "receipt",
  },
  {
    id: "customer-caretaker",
    name: "Customer Caretaker",
    description: "Edits and deactivates customer records, and knows the loyalty-points rules on void and return.",
    icon: "users",
  },
  {
    id: "profit-reader",
    name: "Profit Reader",
    description: "Reads the Profit Report's margin and profit figures with confidence.",
    icon: "chart",
  },
  {
    id: "staff-caretaker",
    name: "Staff Caretaker",
    description: "Edits and deactivates staff records the right way.",
    icon: "badge",
  },
  {
    id: "profile-configurator",
    name: "Profile Configurator",
    description: "Configured the Business Profile and regional settings.",
    icon: "gear",
  },
  {
    id: "device-registrar",
    name: "Device Registrar",
    description: "Registered and revoked a shared device for Staff Mode.",
    icon: "gear",
  },
  {
    id: "briefing-reader",
    name: "Briefing Reader",
    description: "Reads the Wegn AI Executive Briefing like a second language.",
    icon: "spark",
  },
  {
    id: "ai-questioner",
    name: "AI Questioner",
    description: "Knows exactly what Wegn AI can — and can't — do.",
    icon: "spark",
  },
];

export function getBadge(badgeId: string): GuideBadge | undefined {
  return GUIDE_BADGES.find((b) => b.id === badgeId);
}
