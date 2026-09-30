"use client";

import { useEffect, useState } from "react";
import { hasIntroPlayed } from "@/services/readingService";

/**
 * Brief loading veil shown before the first reading of a session. Extracted
 * from app/readings/layout.tsx so that layout can remain a server component.
 */
export default function IntroOverlay() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!hasIntroPlayed()) {
      setShowIntro(true);
    }
  }, []);

  if (!showIntro) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deepnight flex items-center justify-center">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gold-300 animate-pulse" />
    </div>
  );
}
