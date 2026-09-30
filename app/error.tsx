"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Velora Error:", error);
  }, [error]);

  return (
    <>
      <StarBackground />
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full border border-gold-400/20 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <span className="text-gold-300 text-2xl">✦</span>
          </motion.div>
          <motion.h1
            className="font-serif-display text-2xl text-warmwhite mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Something interrupted your reading.
          </motion.h1>
          <motion.p
            className="text-moonlight mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            The cards may be shuffling. Let&apos;s try again.
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={reset}
              className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 rounded-full border border-gold-400/30 text-coolgray text-sm tracking-wider hover:text-warmwhite hover:border-gold-400/60 transition-all"
            >
              Return Home
            </button>
          </motion.div>
        </div>
      </main>
    </>
  );
}