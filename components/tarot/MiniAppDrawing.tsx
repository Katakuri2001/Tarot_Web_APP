"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

type CardSize = "sm" | "md" | "lg";

/** How far the shuffle may wander, as a fraction of the room to each edge.
 *  Kept low so the riffle reads as the deck shuffling in place at the centre. */
const SHUFFLE_SPREAD_X = 0.34;
const SHUFFLE_SPREAD_Y = 0.22;

/** Rendered card dimensions in px. Must stay in sync with `sizeClasses`
 *  in MiniAppCard.tsx so the spread can be centred on the real card box. */
const CARD_DIMENSIONS: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 112, h: 160 },
  md: { w: 144, h: 208 },
  lg: { w: 176, h: 256 },
};

/** Top-left offset of a card centred on the given point. */
const centerOf = (cx: number, cy: number, size: CardSize): { x: number; y: number } => ({
  x: cx - CARD_DIMENSIONS[size].w / 2,
  y: cy - CARD_DIMENSIONS[size].h / 2,
});

interface Props {
  initialType?: ReadingType;
  /**
   * When true the component fills its parent instead of the whole viewport.
   * Used by the homepage "Quick Draw" phone preview so the mini app can be
   * inspected at real mobile dimensions without covering the page.
   */
  embedded?: boolean;
}

export default function MiniAppDrawing({ initialType = "daily", embedded = false }: Props) {
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

  // The size a card is rendered at for a given number of cards in the arena.
  const sizeForCount = useCallback((count: number): CardSize => (count <= 3 ? "lg" : "md"), []);

  // Compute the resting spread, centred in the arena. Cards are fanned along
  // an arc whose apex sits at the container centre, so the group reads as
  // centred rather than drifting up and left.
  const computePositions = useCallback(
    (ids: string[]): Record<string, CardPosition> => {
      const { width, height } = getContainerSize();
      const result: Record<string, CardPosition> = {};
      const count = ids.length;
      if (count === 0) return result;

      const size = sizeForCount(count);
      const { w: cardW } = CARD_DIMENSIONS[size];
      const cx = width / 2;
      const cy = height / 2;

      // Arc geometry. A fixed 60° half-angle keeps the fan readable; the
      // radius is capped by width so the outermost card's centre stays within
      // `width / 2 - cardW / 2` and no card clips the arena edge.
      const maxAngle = count <= 1 ? 0 : 60;
      // Radius also bounded by height so the tall cards never overflow
      // vertically, and 0 for a lone card so it sits dead centre.
      const radius =
        count <= 1
          ? 0
          : Math.min(width * 0.28, height * 0.2, (width / 2 - cardW / 2) / Math.sin((maxAngle * Math.PI) / 180));
      // Half the arc's vertical rise, so the fan's bounding box is centred.
      const lift = (radius * (1 - Math.cos((maxAngle * Math.PI) / 180))) / 2;

      ids.forEach((id, i) => {
        const t = count === 1 ? 0 : i / (count - 1);
        const angle = -maxAngle + 2 * maxAngle * t;
        const rad = (angle * Math.PI) / 180;

        // The arc curves up from its lowest point, so the fan's bounding box
        // sits above the arc centre. `lift` shifts the whole group back down
        // by half that rise, making the *bounding box* — not just the arc —
        // centred on the arena.
        const { x, y } = centerOf(
          cx + radius * Math.sin(rad),
          cy + lift - radius * (1 - Math.cos(rad)),
          size
        );

        result[id] = {
          x,
          y,
          rotate: angle * 0.5,
          scale: 1,
          opacity: 1,
          filter: "none",
        };
      });
      return result;
    },
    [getContainerSize, sizeForCount]
  );

  // A single random position for the shuffle. Cards riffle around the centre
  // of the arena instead of scattering from the top-left corner.
  const randomPosition = useCallback(
    (size: CardSize = "md"): CardPosition => {
      const { width, height } = getContainerSize();
      const { w: cardW, h: cardH } = CARD_DIMENSIONS[size];
      const cx = width / 2;
      const cy = height / 2;

      // Riffle within a tight box around the centre. The range is a fraction of
      // the space to the edges, so the deck visibly shuffles *in place* at the
      // middle of the screen instead of drifting across it.
      const roomX = Math.max(0, cx - cardW / 2 - 8);
      const roomY = Math.max(0, cy - cardH / 2 - 8);
      const rangeX = roomX * SHUFFLE_SPREAD_X;
      const rangeY = roomY * SHUFFLE_SPREAD_Y;

      const { x, y } = centerOf(
        cx + (Math.random() * 2 - 1) * rangeX,
        cy + (Math.random() * 2 - 1) * rangeY,
        size
      );

      return {
        x,
        y,
        rotate: (Math.random() - 0.5) * 18,
        scale: 0.94 + Math.random() * 0.1,
        opacity: 1,
        filter: "none",
      };
    },
    [getContainerSize]
  );

  // Where the status line goes: just below the spread's lower edge, clamped so
  // it always stays inside the arena. Derived from the same geometry as the
  // cards, so it can never overlap the deck.
  const statusTextTop = useMemo(() => {
    const ids = visibleCardIds;
    if (ids.length === 0) return "calc(50% + 150px)";

    const { height } = getContainerSize();
    const { h: cardH } = CARD_DIMENSIONS[sizeForCount(ids.length)];
    const maxAngle = ids.length <= 1 ? 0 : 60;
    const { width } = getContainerSize();
    const { w: cardW } = CARD_DIMENSIONS[sizeForCount(ids.length)];
    const radius =
      ids.length <= 1
        ? 0
        : Math.min(
            width * 0.28,
            height * 0.2,
            (width / 2 - cardW / 2) / Math.sin((maxAngle * Math.PI) / 180)
          );
    const lift = (radius * (1 - Math.cos((maxAngle * Math.PI) / 180))) / 2;

    // Lowest card bottom edge, measured from the arena top.
    const lowest = height / 2 + lift + radius * (1 - Math.cos((maxAngle * Math.PI) / 180)) + cardH / 2;
    const clamped = Math.min(lowest + 20, height - 44);
    return `${Math.max(0, clamped)}px`;
  }, [visibleCardIds, getContainerSize, sizeForCount]);

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

      const shuffleSize = sizeForCount(visible.length);

      // Shuffle animation
      const interval = window.setInterval(() => {
        setPositions((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], ...randomPosition(shuffleSize) };
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
    [computePositions, randomPosition, sizeForCount, sound, reducedMotion]
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

      // Add to recent cards
      setRecentCardIds((prev) => {
        const filtered = prev.filter((rid) => rid !== id);
        return [...filtered, id];
      });

      setSelectedCards((prev) => [
        ...prev,
        { cardId: id, orientation, position },
      ]);

      // Animate selected card to the centre of the arena
      setPositions((prev) => {
        const next = { ...prev };
        const { width, height } = getContainerSize();
        const ids = Object.keys(next);
        const size = sizeForCount(ids.length);
        const centered = centerOf(width / 2, height / 2, size);
        Object.keys(next).forEach((key) => {
          if (key === id) {
            next[key] = { x: centered.x, y: centered.y, rotate: 0, scale: 1.15, opacity: 1, filter: "none" };
          } else {
            next[key] = { ...next[key], scale: 0.7, opacity: 0.15, filter: "blur(4px) brightness(0.4)" };
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
          setSelectedCards((prev) => {
            const selectedIds = prev.map((sc) => sc.cardId);
            const availableIds = tarotCards
              .map((c) => c.id)
              .filter((id) => !selectedIds.includes(id));
            const nextVisible = shuffleArray(availableIds).slice(0, NUM_VISIBLE);
            setVisibleCardIds(nextVisible);
            setPositions(computePositions(nextVisible));
            setPhase("selecting");
            setSelectedCardId(null);
            return prev;
          });
        }
      }, reducedMotion ? 400 : 800);
    },
    [phase, selectedCardId, readingType, currentStep, numCards, recentCardIds, getContainerSize, sound]
  );

  // Draw again — reset to shuffling for proper reroll experience
  const drawAgain = useCallback(() => {
    setResultTransitioning(false);
    setShowResult(false);
    setSelectedCards([]);
    setCurrentStep(0);
    setSelectedCardId(null);
    setRecentCardIds([]);
    setPhase("shuffling");

    timerRef.current = window.setTimeout(() => {
      const allIds = tarotCards.map((c) => c.id);
      const shuffled = shuffleArray(allIds);
      const visible = shuffleArray(shuffled).slice(0, NUM_VISIBLE);
      setVisibleCardIds(visible);
      setPositions(computePositions(visible));
      sound?.shuffle();

      const shuffleSize = sizeForCount(visible.length);

      // Shuffle animation
      const interval = window.setInterval(() => {
        setPositions((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], ...randomPosition(shuffleSize) };
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
    }, reducedMotion ? 300 : 500);
  }, [computePositions, randomPosition, sizeForCount, sound, reducedMotion]);

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

      const shuffleSize = sizeForCount(visible.length);

      const interval = window.setInterval(() => {
        setPositions((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], ...randomPosition(shuffleSize) };
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

  // Recompute the spread when the container changes size (e.g. the embedded
  // phone preview is responsive). Skipped while a draw is in flight so the
  // choreography is never interrupted mid-animation.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let lastWidth = el.offsetWidth;
    let lastHeight = el.offsetHeight;

    const observer = new ResizeObserver(() => {
      const { offsetWidth, offsetHeight } = el;
      if (offsetWidth === lastWidth && offsetHeight === lastHeight) return;
      lastWidth = offsetWidth;
      lastHeight = offsetHeight;

      if (phase === "revealing" || phase === "result" || showResult) return;

      setPositions((prev) => {
        const ids = Object.keys(prev);
        if (ids.length === 0) return prev;
        const fresh = computePositions(ids);
        const next: Record<string, CardPosition> = {};
        ids.forEach((id) => {
          next[id] = { ...fresh[id], opacity: prev[id].opacity, filter: prev[id].filter };
        });
        return next;
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [computePositions, phase, showResult]);

  const getCardState = (cardId: string): "idle" | "selected" | "dimmed" | "revealed" => {
    if (phase === "revealing" || phase === "result") return "revealed";
    if (phase === "selecting") return cardId === selectedCardId ? "selected" : "idle";
    return "idle";
  };

  const isClickable = phase === "selecting" && !selectedCardId;

  return (
    <div
      className={
        embedded
          ? "relative w-full h-full bg-deepnight flex flex-col overflow-hidden"
          : "fixed inset-0 bg-deepnight flex flex-col overflow-hidden"
      }
    >
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-4 py-3 z-20 shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {embedded ? (
          <div className="w-8" />
        ) : (
          <button
            onClick={() => router.push("/")}
            className="text-moonlight hover:text-gold-300 transition-colors p-2 -ml-2"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
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
      <div ref={containerRef} className="flex-1 relative z-10 min-h-0">
        {/* Cards are absolutely positioned and placed by an explicit arc, so
            this wrapper is a plain positioned box rather than a flex column. */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(26,10,62,0.3) 0%, rgba(6,6,15,0.95) 100%)",
          }}
        >
          <AnimatePresence>
            {visibleCardIds.map((cardId, i) => {
              const card = getCardById(cardId);
              if (!card) return null;
              const state = getCardState(cardId);
              const pos = positions[cardId] || { x: 100, y: 100, rotate: 0, scale: 1, opacity: 1, filter: "none" };
              return (
                <MiniAppCard
                  key={cardId}
                  card={card}
                  orientation={state === "revealed" ? (selectedCards.find((c) => c.cardId === cardId)?.orientation || "upright") : "upright"}
                  position={pos}
                  layout="absolute"
                  isSelected={state === "selected"}
                  isRevealed={state === "revealed"}
                  isDimmed={state === "dimmed"}
                  isClickable={isClickable && state === "idle"}
                  index={i}
                  size={sizeForCount(visibleCardIds.length)}
                  onSelect={() => selectCard(cardId)}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status text — anchored just below the spread's own lower edge, so it
            clears the deck on every viewport instead of a fixed offset. */}
        <AnimatePresence mode="wait">
          {(phase === "selecting" || phase === "revealing") && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 text-center z-30 pointer-events-none"
              style={{ top: statusTextTop }}
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
