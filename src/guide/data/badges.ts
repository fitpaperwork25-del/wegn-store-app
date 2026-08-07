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
];

export function getBadge(badgeId: string): GuideBadge | undefined {
  return GUIDE_BADGES.find((b) => b.id === badgeId);
}
