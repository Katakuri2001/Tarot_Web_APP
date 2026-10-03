"use client";

import { useEffect, useState } from "react";
import { hasIntroPlayed, markIntroPlayed } from "@/services/readingService";

/** How long the first-reading veil stays on screen. */
const INTRO_DURATION_MS = 700;

/**
 * Brief loading veil shown before the first reading of a session. Extracted
 * from app/readings/layout.tsx so that layout can remain a server component.
 *
 * Two things keep this from blocking the reading flow (it sits at z-50 over a
 * card arena at z-10/30):
 *
 * 1. It is `pointer-events-none`, so even while visible it cannot absorb a tap.
 * 2. It always dismisses itself. The previous version only ever assigned
 *    `showIntro` to `true` and never called `markIntroPlayed()`, so the veil
 *    covered every /readings/* route for the whole session and every card tap
 *    was swallowed silently.
 */
export default function IntroOverlay() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!hasIntroPlayed()) {
      // Claim the flag immediately rather than on unmount: if the visitor
      // navigates away mid-veil we still must not replay it on the next route.
      markIntroPlayed();
      setShowIntro(true);
    }

    // Scheduling the timer unconditionally matters. Guarding it on
    // hasIntroPlayed() as well leaves the veil stuck under StrictMode's
    // double-invoked effects: the first pass claims the flag and arms a timer,
    // cleanup clears it, and the second pass then returns early — nothing
    // remains to dismiss the overlay.
    const timer = window.setTimeout(() => setShowIntro(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

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
