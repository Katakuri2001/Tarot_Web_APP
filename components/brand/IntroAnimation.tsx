"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { hasIntroPlayed, markIntroPlayed } from "@/services/readingService";
import { useReducedMotion } from "@/hooks/useShared";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState(0);
  const [skipReady, setSkipReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      markIntroPlayed();
      onComplete();
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setPhase(1);
        timers.push(setTimeout(() => setPhase(2), 600));
        timers.push(setTimeout(() => setPhase(3), 1200));
        timers.push(setTimeout(() => setPhase(4), 1800));
        timers.push(setTimeout(() => setPhase(5), 2400));
        timers.push(
          setTimeout(() => {
            markIntroPlayed();
            onComplete();
          }, 3000)
        );
      }, 500)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete, reducedMotion]);

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: reducedMotion ? 0.3 : 0.8, ease: "easeOut" },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-deepnight"
      onAnimationComplete={() => {
        if (phase >= 4 && !skipReady) setSkipReady(true);
      }}
    >
      {/* Phase 0: Tiny star */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-gold-300"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Phase 1: Star grows + glow */}
      <AnimatePresence>
        {phase >= 1 && phase < 2 && (
          <>
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,184,90,0.2) 0%, transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-gold-300"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Phase 2: Brand symbol appears */}
      <AnimatePresence>
        {phase >= 2 && phase < 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Logo size="small" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Brand name + tagline */}
      <AnimatePresence>
        {phase >= 3 && phase < 4 && (
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="font-serif-display text-4xl md:text-5xl tracking-widest text-gold-300"
              style={{ fontWeight: 300 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              VELORA
            </motion.h1>
            <motion.p
              className="font-serif-display text-sm md:text-base tracking-wider text-moonlight italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Read Beyond The Visible.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Logo glow + transition */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div
              className="w-64 h-64 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,184,90,0.15) 0%, rgba(26,10,62,0.1) 50%, transparent 70%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip intro for returning users - hidden but works */}
      {skipReady && phase >= 4 && (
        <button
          onClick={() => {
            markIntroPlayed();
            onComplete();
          }}
          className="absolute bottom-8 text-coolgray text-xs tracking-wider uppercase hover:text-warmwhite transition-colors"
          aria-label="Skip intro"
        >
          Skip
        </button>
      )}
    </motion.div>
  );
}
