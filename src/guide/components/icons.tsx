// Minimal hand-rolled icon set — the rest of this app has no icon
// library dependency (checked package.json before adding this guide
// module), so this stays consistent with that rather than pulling one
// in for a Phase 1 shell. Every icon is a plain 20x20 stroke SVG.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const GuideIcon = {
  home: (p: IconProps) => base(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" /></>, p),
  search: (p: IconProps) => base(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" /></>, p),
  flag: (p: IconProps) => base(<><path d="M6 21V4" /><path d="M6 4h11l-2.5 4L17 12H6" /></>, p),
  sun: (p: IconProps) => base(<><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6 6 18M18 6l1.6-1.6" /></>, p),
  box: (p: IconProps) => base(<><path d="M3.5 8 12 3.5 20.5 8 12 12.5 3.5 8Z" /><path d="M3.5 8v8.5L12 21l8.5-4.5V8" /><path d="M12 12.5V21" /></>, p),
  cart: (p: IconProps) => base(<><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /><path d="M2.5 3h2.4l2.2 11.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L20.5 7H6" /></>, p),
  users: (p: IconProps) => base(<><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19c.8-3.1 3.3-5 6.2-5s5.4 1.9 6.2 5" /><circle cx="17.2" cy="9.3" r="2.6" /><path d="M15.8 13.2c2.1.4 3.9 1.9 4.5 4.3" /></>, p),
  chart: (p: IconProps) => base(<><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2.5 20.5h19" /></>, p),
  badge: (p: IconProps) => base(<><circle cx="12" cy="9" r="4.2" /><path d="M8.3 12.6 6 21l6-2.7 6 2.7-2.3-8.4" /></>, p),
  gear: (p: IconProps) => base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 13.6a7.6 7.6 0 0 0 0-3.2l2-1.4-2-3.4-2.3.8a7.7 7.7 0 0 0-2.8-1.6L14 2.5h-4l-.3 2.3a7.7 7.7 0 0 0-2.8 1.6l-2.3-.8-2 3.4 2 1.4a7.6 7.6 0 0 0 0 3.2l-2 1.4 2 3.4 2.3-.8c.8.7 1.8 1.3 2.8 1.6l.3 2.3h4l.3-2.3c1-.3 2-.9 2.8-1.6l2.3.8 2-3.4-2-1.4Z" /></>, p),
  spark: (p: IconProps) => base(<><path d="M12 2.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" /><path d="M19 16.5c.3 1.6 1 2.3 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.3 2.3-1 2.6-2.6Z" /></>, p),
  "life-ring": (p: IconProps) => base(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.6" /><path d="m5.8 5.8 3.6 3.6M18.2 5.8l-3.6 3.6M5.8 18.2l3.6-3.6M18.2 18.2l-3.6-3.6" /></>, p),
  trophy: (p: IconProps) => base(<><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" /><path d="M12 14v3M9 21h6M9.5 21c0-1.8.7-3 2.5-4 1.8 1 2.5 2.2 2.5 4" /></>, p),
  menu: (p: IconProps) => base(<><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" /></>, p),
  close: (p: IconProps) => base(<path d="M5 5l14 14M19 5 5 19" />, p),
  moon: (p: IconProps) => base(<path d="M20.5 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z" />, p),
  keyboard: (p: IconProps) => base(<><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 14h12" /></>, p),
  help: (p: IconProps) => base(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2" /><path d="M12 17h.01" /></>, p),
  bookmark: (p: IconProps) => base(<path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4-6.5 4V4.5a1 1 0 0 1 1-1Z" />, p),
  chevronRight: (p: IconProps) => base(<path d="m9 5 7 7-7 7" />, p),
  chevronLeft: (p: IconProps) => base(<path d="m15 5-7 7 7 7" />, p),
  check: (p: IconProps) => base(<path d="M4 12.5 9.5 18 20 6.5" />, p),
  grid: (p: IconProps) => base(<><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" /><rect x="13" y="13" width="7.5" height="7.5" rx="1.5" /></>, p),
  receipt: (p: IconProps) => base(<><path d="M6 3.5h12v17l-2.5-1.6-2.5 1.6-2.5-1.6L8 20.5l-2-1.3V3.5Z" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>, p),
  compass: (p: IconProps) => base(<><circle cx="12" cy="12" r="9.5" /><path d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9Z" /></>, p),
  flame: (p: IconProps) => base(<path d="M12 21.5c-4 0-6.5-2.7-6.5-6 0-2.6 1.7-4 2.6-6.1.6 1 .9 2 .9 2.9 0-3.3 1.4-6.2 3.7-7.8-.4 2-.1 3.6.9 5 .6-1 .8-1.9.8-2.9 2 1.7 4.1 4.2 4.1 7.9 0 3.3-2.5 7-6.5 7Z" />, p),
} as const;

export type GuideIconName = keyof typeof GuideIcon;
