// Roles asked at first entry (see components/RoleSelector.tsx). A
// role just picks a default/recommended learning path — nothing else
// in the app changes behavior based on it, and it can be changed any
// time from the Academy Dashboard.

import type { GuideIconName } from "../components/icons";

export interface AcademyRole {
  id: string;
  name: string;
  description: string;
  icon: GuideIconName;
  recommendedPathId: string;
}

export const ACADEMY_ROLES: AcademyRole[] = [
  {
    id: "business-owner",
    name: "Business Owner",
    description: "I own or run the whole business.",
    icon: "trophy",
    recommendedPathId: "business-owner",
  },
  {
    id: "store-manager",
    name: "Store Manager",
    description: "I manage a shift, the team, or a location.",
    icon: "badge",
    recommendedPathId: "store-manager",
  },
  {
    id: "cashier",
    name: "Cashier",
    description: "I work the register day to day.",
    icon: "cart",
    recommendedPathId: "cashier-certification",
  },
  {
    id: "inventory-clerk",
    name: "Inventory Clerk",
    description: "I handle stock, receiving, and counts.",
    icon: "box",
    recommendedPathId: "inventory-specialist",
  },
  {
    id: "administrator",
    name: "Administrator",
    description: "I set up and configure WEGN Store.",
    icon: "gear",
    recommendedPathId: "store-manager",
  },
];

export function getRole(roleId: string): AcademyRole | undefined {
  return ACADEMY_ROLES.find((r) => r.id === roleId);
}
