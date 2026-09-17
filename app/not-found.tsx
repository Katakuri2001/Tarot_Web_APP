"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <StarBackground />
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-gold-400/20 flex items-center justify-center">
            <span className="text-gold-300 text-3xl font-serif-display">?</span>
          </div>
          <h1 className="font-serif-display text-4xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
            Lost in the Cards
          </h1>
          <p className="text-moonlight mb-8">
            This path isn&apos;t part of your journey yet. Let&apos;s find your way back.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors"
          >
            Return Home
          </button>
        </div>
      </main>
    </>
  );
}
