// Learning Paths — curated sequences of lessons (mixing already-built
// lessons and still-to-come stubs) toward a role-relevant outcome.
// Progress/completion are always derived from real completedLessonIds
// against lessonIds here; a path with unbuilt lessons in it honestly
// can't reach 100% yet, and that's fine — no fake progress.

import type { GuideIconName } from "../components/icons";

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: GuideIconName;
  /** Path-level gate: this path is locked until the referenced path
   *  is fully completed (all its lessons done, i.e. certified). */
  prerequisitePathId?: string;
  lessonIds: string[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "The essentials every new team member needs on day one.",
    icon: "flag",
    lessonIds: ["welcome-to-wegn-store", "opening-cash-drawer", "sample-first-sale"],
  },
  {
    id: "cashier-certification",
    name: "Cashier Certification",
    description: "Everything it takes to run the register with confidence, start to finish.",
    icon: "cart",
    prerequisitePathId: "beginner",
    lessonIds: [
      "welcome-to-wegn-store",
      "opening-cash-drawer",
      "sample-first-sale",
      "barcode-scanning",
      "product-search",
      "applying-discounts",
      "payment-methods",
      "printing-receipt",
      "processing-return",
      "closing-cash-drawer",
    ],
  },
  {
    id: "inventory-specialist",
    name: "Inventory Specialist",
    description: "Keep stock accurate — from adding products to running counts.",
    icon: "box",
    prerequisitePathId: "beginner",
    lessonIds: ["inv-1", "inv-2", "inv-3", "inv-4", "inv-5", "pur-1", "pur-2"],
  },
  {
    id: "store-manager",
    name: "Store Manager",
    description: "Run a shift end to end: the register, the team, and the numbers.",
    icon: "badge",
    prerequisitePathId: "cashier-certification",
    lessonIds: [
      "welcome-to-wegn-store",
      "opening-cash-drawer",
      "sample-first-sale",
      "barcode-scanning",
      "product-search",
      "applying-discounts",
      "payment-methods",
      "printing-receipt",
      "processing-return",
      "closing-cash-drawer",
      "do-1",
      "do-2",
      "do-3",
      "do-4",
      "rep-1",
      "rep-2",
      "rep-3",
      "emp-1",
      "emp-2",
      "emp-3",
    ],
  },
  {
    id: "business-owner",
    name: "Business Owner",
    description: "The full picture — sales, stock, staff, purchasing, reporting, settings, and Wegn AI.",
    icon: "trophy",
    prerequisitePathId: "store-manager",
    lessonIds: [
      "welcome-to-wegn-store",
      "opening-cash-drawer",
      "sample-first-sale",
      "barcode-scanning",
      "product-search",
      "applying-discounts",
      "payment-methods",
      "printing-receipt",
      "processing-return",
      "closing-cash-drawer",
      "do-1",
      "do-2",
      "do-3",
      "do-4",
      "inv-1",
      "inv-2",
      "inv-3",
      "inv-4",
      "inv-5",
      "pur-1",
      "pur-2",
      "pur-3",
      "pur-4",
      "cust-1",
      "cust-2",
      "cust-3",
      "rep-1",
      "rep-2",
      "rep-3",
      "emp-1",
      "emp-2",
      "emp-3",
      "settings-1",
      "settings-2",
      "ai-1",
      "ai-2",
      "ts-1",
      "ts-2",
    ],
  },
];

export function getLearningPath(pathId: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === pathId);
}
