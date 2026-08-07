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
    description: "Completed your first lesson in the WEGN Store Guide.",
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
];

export function getBadge(badgeId: string): GuideBadge | undefined {
  return GUIDE_BADGES.find((b) => b.id === badgeId);
}
