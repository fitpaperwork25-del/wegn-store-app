// Tiny hash-based route reader/writer. No react-router dependency (the
// host app has none either - checked package.json before adding this)
// and no server-side rewrite config is needed since '#...' never
// leaves the client. Gives the guide real, shareable, back/forward-
// capable URLs (e.g. #inventory, #lesson/sample-first-sale,
// #certificate/cashier-certification) without any new infrastructure.

import { useCallback, useEffect, useState } from "react";
import type { GuideSectionId } from "../data/navigation";

export interface GuideRoute {
  sectionId: GuideSectionId;
  lessonId: string | null;
  /** Set only for #certificate/<pathId> — takes priority over
   *  sectionId/lessonId when present. */
  certificatePathId?: string;
}

const DEFAULT_ROUTE: GuideRoute = { sectionId: "home", lessonId: null };

function parseHash(hash: string): GuideRoute {
  const clean = hash.replace(/^#\/?/, "");
  if (!clean) return DEFAULT_ROUTE;
  const [first, second] = clean.split("/");
  if (first === "lesson" && second) {
    return { sectionId: "getting-started", lessonId: second };
  }
  if (first === "certificate" && second) {
    return { sectionId: "learning-paths", lessonId: null, certificatePathId: second };
  }
  return { sectionId: (first as GuideSectionId) || "home", lessonId: null };
}

export function useHashRoute(): [GuideRoute, (route: GuideRoute) => void] {
  const [route, setRoute] = useState<GuideRoute>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: GuideRoute) => {
    const hash = next.certificatePathId
      ? `#certificate/${next.certificatePathId}`
      : next.lessonId
        ? `#lesson/${next.lessonId}`
        : `#${next.sectionId}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(next);
    }
  }, []);

  return [route, navigate];
}
