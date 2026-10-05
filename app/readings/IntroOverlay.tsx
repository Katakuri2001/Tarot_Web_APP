"use client";

import { useEffect, useState } from "react";
import { hasIntroPlayed, markIntroPlayed } from "@/services/readingService";
import { useReducedMotion } from "@/hooks/useShared";

/** How long the veil stays up before it marks the intro as played. */
const VEIL_MS = 900;

/**
 * Brief loading veil shown before the first reading of a session. Extracted
 * from app/readings/layout.tsx so that layout can remain a server component.
 *
 * The veil has to be BOUNDED. It previously latched `showIntro` on mount and
 * had no code path that ever cleared it, while the sessionStorage flag it
 * reads is only written by the homepage IntroAnimation. Any visitor who
 * reached a /readings/* route without loading "/" first — a deep link, a
 * shared URL, a refresh — was left behind a full-viewport overlay that
 * swallowed every tap, with no way out.
 *
 * Two independent guarantees, so a stuck veil can never lock the page again:
 *   1. the veil clears itself and writes the flag when it finishes, and
 *   2. it is pointer-events-none, because it is purely decorative.
 */
export default function IntroOverlay() {
  const reducedMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (hasIntroPlayed()) return;

    // Reduced motion means no decorative flourish at all.
    if (reducedMotion) {
      markIntroPlayed();
      return;
    }

    setShowIntro(true);
    const timer = setTimeout(() => {
      markIntroPlayed();
      setShowIntro(false);
    }, VEIL_MS);

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  if (!showIntro) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-deepnight flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gold-300 animate-pulse" />
    </div>
  );
}
