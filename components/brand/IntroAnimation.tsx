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
        timers.push(setTimeout(() => setPhase(2), 800));
        timers.push(setTimeout(() => setPhase(3), 1600));
        timers.push(setTimeout(() => setPhase(4), 2400));
        timers.push(
          setTimeout(() => {
            markIntroPlayed();
            onComplete();
          }, 3200)
        );
      }, 400)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete, reducedMotion]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-deepnight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Phase 0: Tiny point of light in darkness */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            className="absolute inset-0 bg-deepnight"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Phase 0: Tiny star */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-gold-300"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Phase 1: Celestial glow and lines */}
      <AnimatePresence>
        {phase === 1 && (
          <>
            <motion.div
              className="absolute w-40 h-40 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,184,90,0.15) 0%, rgba(26,10,62,0.05) 40%, transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-gold-300"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
            {/* Celestial lines */}
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-gold-400/10"
              style={{ borderStyle: "dashed" }}
              initial={{ opacity: 0, rotate: 0, scale: 0 }}
              animate={{ opacity: 0.3, rotate: 45, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-gold-400/10"
              style={{ borderStyle: "dashed" }}
              initial={{ opacity: 0, rotate: 0, scale: 0 }}
              animate={{ opacity: 0.2, rotate: -45, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Phase 2: Symbol emergence */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Logo size="small" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Brand reveal */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="font-serif-display text-3xl md:text-4xl text-warmwhite"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              VELORA
            </motion.h1>
            <motion.p
              className="font-serif-display text-sm text-moonlight italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Read Beyond The Visible.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Final glow + transition */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,184,90,0.1) 0%, rgba(26,10,62,0.05) 50%, transparent 70%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip intro for returning users */}
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