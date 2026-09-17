"use client";

import { useEffect, useState } from "react";
import IntroAnimation from "@/components/brand/IntroAnimation";
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
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      <main className="relative z-10">{children}</main>
    </>
  );
}
