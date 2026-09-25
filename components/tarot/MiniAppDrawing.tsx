"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useReducedMotion, useSoundEnabled } from "@/hooks/useShared";
import { useSound } from "@/services/soundService";
import { tarotCards } from "@/data/tarotCards";
import {
  getCardById,
  getCardInterpretation,
  getReadingTypeLabel,
  getReadingTypePositions,
  shuffleArray,
  generateOrientation,
} from "@/utils/tarotUtils";
import { saveReadingToStorage } from "@/services/readingService";
import MiniAppCard from "@/components/tarot/MiniAppCard";
import { getReadingTypePositions as getPositions } from "@/utils/tarotUtils";
import type { ReadingType, Orientation } from "@/data/types";

const READING_TYPES: { type: ReadingType; label: string; icon: string; count: number }[] = [
  { type: "daily", label: "Daily", icon: "☀", count: 1 },
  { type: "love", label: "Love", icon: "♥", count: 3 },
  { type: "career", label: "Career", icon: "⚡", count: 3 },
  { type: "general", label: "General", icon: "✦", count: 3 },
];

const NUM_VISIBLE = 7;

interface CardPosition {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity?: number;
  filter?: string;
}

interface Props {
  initialType?: ReadingType;
}

export default function MiniAppDrawing({ initialType = "daily" }: Props) {
  const reducedMotion = useReducedMotion();
  const [soundEnabled] = useSoundEnabled();
  const sound = useSound(soundEnabled);
  const router = useRouter();

  const [phase, setPhase] = useState<"type-select" | "shuffling" | "spread" | "selecting" | "revealing" | "result">(initialType ? "shuffling" : "type-select");
  const [readingType, setReadingType] = useState<ReadingType>(initialType || "daily");
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>(initialType ? [] : []);
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Array<{ cardId: string; orientation: Orientation; position: string }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recentCardIds, setRecentCardIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultTransitioning, setResultTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const shuffleIntervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const numCards = readingType === "daily" ? 1 : 3;

  // Get container dimensions
  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { width: 360, height: 600 };
    return { width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight };
  }, []);

  // Compute spread positions
  const computePositions = useCallback(
    (ids: string[]): Record<string, CardPosition> => {
      const { width, height } = getContainerSize();
      const result: Record<string, CardPosition> = {};
      const count = ids.length;
      const radius = Math.min(width, height) * 0.2;

      ids.forEach((id, i) => {
        const angle = -60 + (120 / (count - 1 || 1)) * i;
        const rad = angle * (Math.PI / 180);
        result[id] = {
          x: width / 2 + radius * Math.sin(rad) - 60,
          y: height * 0.4 + radius * Math.cos(rad) - 80,
          rotate: angle * 0.5,
          scale: 1,
        };
      });
      return result;
    },
    [getContainerSize]
  );

  // Get a random position for shuffling
  const randomPosition = useCallback((): CardPosition => {
    const { width, height } = getContainerSize();
    return {
      x: Math.random() * Math.max(10, width - 120),
      y: Math.random() * Math.max(10, height - 180),
      rotate: (Math.random() - 0.5) * 50,
      scale: 0.8 + Math.random() * 0.2,
    };
  }, [getContainerSize]);

  // Start a new reading
  const startReading = useCallback(
    (type: ReadingType) => {
      const allIds = tarotCards.map((c) => c.id);
      const shuffled = shuffleArray(allIds);
      const visible = shuffleArray(shuffled).slice(0, NUM_VISIBLE);
      setReadingType(type);
      setVisibleCardIds(visible);
      setPositions(computePositions(visible));
      setSelectedCardId(null);
      setSelectedCards([]);
      setCurrentStep(0);
      setShowResult(false);
      setResultTransitioning(false);
      setPhase("shuffling");
      sound?.shuffle();

      // Shuffle animation
      const interval = window.setInterval(() => {
        setPositions((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], ...randomPosition() };
          });
          return next;
        });
      }, reducedMotion ? 80 : 120);

      const duration = reducedMotion ? 1200 : 2500;
      timerRef.current = window.setTimeout(() => {
        clearInterval(interval);
        setPositions((prev) => computePositions(Object.keys(prev)));
        setPhase("selecting");
      }, duration);
    },
    [computePositions, randomPosition, sound, reducedMotion]
  );

  // Select a card
  const selectCard = useCallback(
    (id: string) => {
      if (phase !== "selecting" || selectedCardId) return;
      const card = getCardById(id);
      if (!card) return;

      setSelectedCardId(id);
      sound?.flip();

      const orientation = generateOrientation();
      const positions_list = getReadingTypePositions(readingType);
      const position = positions_list[currentStep]?.position || "past";

      // Check if this card is in recent cards
      const isRecent = recentCardIds.includes(id);
      // We still allow it but track it

      // Add to recent cards
      setRecentCardIds((prev) => {
        const filtered = prev.filter((rid) => rid !== id);
        return [...filtered, id];
      });

      setSelectedCards((prev) => [
        ...prev,
        { cardId: id, orientation, position },
      ]);

      // Animate selected card to center
      setPositions((prev) => {
        const next = { ...prev };
        const { width, height } = getContainerSize();
        Object.keys(next).forEach((key) => {
          if (key === id) {
            next[key] = { x: width / 2 - 60, y: height * 0.35 - 80, rotate: 0, scale: 1.15 };
          } else {
            next[key] = { ...next[key], scale: 0.7, opacity: 0.15 as any, filter: "blur(4px) brightness(0.4)" as any };
          }
        });
        return next;
      });

      setPhase("revealing");

      // After reveal, check if more cards needed
      timerRef.current = window.setTimeout(() => {
        if (currentStep + 1 >= numCards) {
          setShowResult(true);
          setResultTransitioning(true);
          sound?.reveal();
        } else {
          setCurrentStep((prev) => prev + 1);
          sound?.shuffle();

          // Prepare next card draw
          const availableIds = tarotCards
            .map((c) => c.id)
            .filter((id) => !selectedCards.find((sc) => sc.cardId === id));
          const nextVisible = shuffleArray(availableIds).slice(0, NUM_VISIBLE);
          setVisibleCardIds(nextVisible);
          setPositions(computePositions(nextVisible));
          setPhase("selecting");
          setSelectedCardId(null);
        }
      }, reducedMotion ? 400 : 800);
    },
    [phase, selectedCardId, readingType, currentStep, numCards, recentCardIds, selectedCards, getContainerSize, sound]
  );

  // Draw again
  const drawAgain = useCallback(() => {
    setResultTransitioning(false);
    setShowResult(false);
    setSelectedCards([]);
    setCurrentStep(0);
    setSelectedCardId(null);
    setRecentCardIds([]);

    timerRef.current = window.setTimeout(() => {
      const allIds = tarotCards.map((c) => c.id);
      const shuffled = shuffleArray(allIds);
      const visible = shuffleArray(shuffled).slice(0, NUM_VISIBLE);
      setVisibleCardIds(visible);
      setPositions(computePositions(visible));
      setPhase("selecting");
      sound?.shuffle();
    }, reducedMotion ? 300 : 500);
  }, [computePositions, sound, reducedMotion]);

  // Auto-start shuffling when initialType is provided (for direct Mini App links)
  useEffect(() => {
    if (initialType) {
      const allIds = tarotCards.map((c) => c.id);
      const shuffled = shuffleArray(allIds);
      const visible = shuffleArray(shuffled).slice(0, NUM_VISIBLE);
      setVisibleCardIds(visible);
      setPositions(computePositions(visible));
      setPhase("shuffling");
      sound?.shuffle();

      const interval = window.setInterval(() => {
        setPositions((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], ...randomPosition() };
          });
          return next;
        });
      }, reducedMotion ? 80 : 120);

      const duration = reducedMotion ? 1200 : 2500;
      const timeout = window.setTimeout(() => {
        clearInterval(interval);
        setPositions((prev) => computePositions(Object.keys(prev)));
        setPhase("selecting");
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [initialType]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getCardState = (cardId: string): "idle" | "selected" | "dimmed" | "revealed" => {
    if (phase === "revealing" || phase === "result") return "revealed";
    if (phase === "selecting") return cardId === selectedCardId ? "selected" : "idle";
    return "idle";
  };

  const isClickable = phase === "selecting" && !selectedCardId;

  return (
    <div className="fixed inset-0 bg-deepnight flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-4 py-3 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-moonlight hover:text-gold-300 transition-colors p-2 -ml-2"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-serif-display text-lg text-warmwhite">Velora</span>
          <span className="text-gold-300 text-xs tracking-widest">✦</span>
        </div>
        <div className="w-8" /> {/* Spacer */}
      </motion.header>

      {/* Type Selection Screen */}
      <AnimatePresence mode="wait">
        {phase === "type-select" && (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center px-4 pb-8"
            key="type-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="font-serif-display text-3xl text-warmwhite mb-2 text-center"
              style={{ fontWeight: 300 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Choose Your Reading
            </motion.h1>
            <motion.p
              className="text-moonlight text-sm mb-10 text-center max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              What would you like to know?
            </motion.p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {READING_TYPES.map((rt, i) => (
                <motion.button
                  key={rt.type}
                  className="glass p-4 sm:p-5 rounded-xl text-center hover:border-gold-400/30 transition-all duration-300 min-h-[100px] flex flex-col items-center justify-center touch-manipulation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => startReading(rt.type)}
                >
                  <span className="text-2xl mb-2">{rt.icon}</span>
                  <span className="font-serif-display text-lg text-warmwhite mb-1">{rt.label}</span>
                  <span className="text-muted text-xs">{rt.count} card{rt.count > 1 ? "s" : ""}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Drawing Arena */}
      <div ref={containerRef} className="flex-1 relative z-10">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-4"
          style={{
            background: "radial-gradient(ellipse at center, rgba(26,10,62,0.3) 0%, rgba(6,6,15,0.95) 100%)",
          }}
        >
          <AnimatePresence mode="popLayout">
            {visibleCardIds.map((cardId, i) => {
              const card = getCardById(cardId);
              if (!card) return null;
              const state = getCardState(cardId);
              const pos = positions[cardId] || { x: 100, y: 100, rotate: 0, scale: 1 };
              return (
                <MiniAppCard
                  key={cardId}
                  card={card}
                  orientation={state === "revealed" ? (selectedCards.find((c) => c.cardId === cardId)?.orientation || "upright") : "upright"}
                  position={pos}
                  isSelected={state === "selected"}
                  isRevealed={state === "revealed"}
                  isDimmed={state === "dimmed"}
                  isClickable={isClickable && state === "idle"}
                  index={i}
                  size={visibleCardIds.length <= 3 ? "lg" : "md"}
                  onSelect={() => selectCard(cardId)}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {(phase === "selecting" || phase === "revealing") && (
            <motion.div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center z-30"
              key="status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {phase === "selecting" && (
                <p className="text-gold-300 tracking-widest uppercase text-xs">
                  {numCards === 1 ? "Choose a card" : `Select ${Math.min(currentStep + 1, numCards)} of ${numCards}`}
                </p>
              )}
              {phase === "revealing" && (
                <p className="text-gold-300 tracking-widest uppercase text-xs">Revealing...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result Screen */}
      <AnimatePresence>
        {showResult && selectedCards.length > 0 && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center bg-deepnight/95 backdrop-blur-lg overflow-y-auto"
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Result header */}
            <motion.div
              className="w-full px-4 pt-4 pb-2 flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="font-serif-display text-xl text-gold-300 tracking-widest uppercase">
                {getReadingTypeLabel(readingType)} Reading
              </span>
            </motion.div>

            {/* Card display */}
            <motion.div
              className="flex justify-center gap-3 sm:gap-4 my-4 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {selectedCards.map((sc, i) => {
                const data = getCardById(sc.cardId);
                if (!data) return null;
                return (
                  <motion.div
                    key={sc.cardId}
                    className="w-28 h-40 sm:w-36 sm:h-52"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  >
                    <MiniAppCard
                      card={data}
                      orientation={sc.orientation}
                      isRevealed={true}
                      size="md"
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Interpretation */}
            <motion.div
              className="w-full max-w-md px-4 mb-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {selectedCards.map((sc, i) => {
                const data = getCardById(sc.cardId);
                if (!data) return null;
                const interpretation = getCardInterpretation(data, sc.orientation, readingType);

                return (
                  <div key={sc.cardId} className="glass p-4 sm:p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-serif-display text-lg text-warmwhite">
                        {data.name}
                      </h3>
                      <span className="text-xs text-gold-300 bg-gold-400/10 px-2 py-0.5 rounded-full">
                        {sc.orientation === "reversed" ? "Reversed" : "Upright"}
                      </span>
                    </div>
                    <p className="text-moonlight text-sm leading-relaxed mb-2">{interpretation}</p>
                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {data.keywords.slice(0, 4).map((k) => (
                        <span key={k} className="text-[10px] tracking-wider bg-gold-400/10 text-gold-300 px-2 py-0.5 rounded-full">
                          {k}
                        </span>
                      ))}
                    </div>
                    {/* Advice */}
                    <p className="text-coolgray text-xs italic">{data.advice}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Draw Again Button */}
            <motion.div
              className="px-4 pb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button
                onClick={drawAgain}
                className="px-8 py-3.5 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors touch-manipulation min-h-[44px]"
                whileTap={{ scale: 0.96 }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                ↻ Draw Again
              </motion.button>
              <p className="text-muted text-xs text-center mt-3">
                Your past readings are saved to history
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
