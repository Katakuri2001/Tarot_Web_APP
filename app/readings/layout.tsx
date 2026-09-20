"use client";

import { useEffect, useState } from "react";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import { hasIntroPlayed } from "@/services/readingService";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!hasIntroPlayed()) {
      setShowIntro(true);
    }
  }, []);

  return (
    <>
      <StarBackground />
      <Navigation />
      {showIntro && (
        <div className="fixed inset-0 z-50 bg-deepnight flex items-center justify-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gold-300 animate-pulse" />
        </div>
      )}
      <main className="relative z-10">{children}</main>
    </>
  );
}