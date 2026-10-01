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

/** The deck is a single hero card, so the arena always uses the large size
 *  regardless of how many cards are in it. */
const DECK_SIZE: CardSize = "lg";

/** Shuffle motion. Each card travels from the top of the stack to the bottom
 *  and re-enters at the top, with every card offset by an even slice of the
 *  cycle. That stagger is what makes it read as a real shuffle — a stream of
 *  cards cascading down — instead of every card jittering in place. */
const SHUFFLE_TRAVEL = 88;
const SHUFFLE_SPEED = 0.085;
const SHUFFLE_X_JITTER = 7;
const SHUFFLE_ROT_JITTER = 5;

/**
 * Dome fan — how the deck rests once shuffled, so every card is visible and
 * individually tappable rather than only the top one.
 *
 * The fan is elliptical: cards sit on an arc whose horizontal radius is solved
 * so the *rotated* card corners clear the arena sides, and whose depth is
 * capped to stay under a card height (a dome deeper than a card stops reading
 * as a fan). Depth is what gives each card an exposed strip: neighbours sit
 * ~47px lower, so the top of every card stays clear and tappable.
 */
const DOME_HALF_ANGLE = (45 * Math.PI) / 180;
const DOME_ROTATE = 11;
const DOME_MAX_RADIUS_X = 220;
const DOME_MIN_DROOP = 24;
/**
 * Dome depth as a fraction of a card's height. This is the tap-target knob:
 * each card sits ~81px lower than its left neighbour, so that much of its own
 * face is never covered and stays tappable. Shallower domes (0.34) only left a
 * ~13px sliver on a 320px screen.
 */
const DOME_DROOP_RATIO = 0.58;
const DOME_PAD = 10;

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
  /**
   * Skip the reading-type picker and begin this reading immediately. Leave it
   * undefined to start on the picker, which is the default everywhere except
   * deep links like /readings/love.
   */
  initialType?: ReadingType;
  /**
   * When true the component fills its parent instead of the whole viewport.
   * Used by the homepage "Quick Draw" phone preview so the mini app can be
   * inspected at real mobile dimensions without covering the page.
   */
  embedded?: boolean;
}

export default function MiniAppDrawing({ initialType, embedded = false }: Props) {
  const reducedMotion = useReducedMotion();
  const [soundEnabled] = useSoundEnabled();
  const sound = useSound(soundEnabled);
  const router = useRouter();

  // Monotonic clock for the shuffle cascade. Kept in a ref so the interval can
  // advance it without re-creating itself every tick.
  const shuffleTickRef = useRef(0);

  const [phase, setPhase] = useState<"type-select" | "shuffling" | "spread" | "selecting" | "revealing" | "result">(initialType ? "shuffling" : "type-select");
  const [readingType, setReadingType] = useState<ReadingType>(initialType || "daily");
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Array<{ cardId: string; orientation: Orientation; position: string }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
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

  // Resting position: a dome of cards, centred in the arena, every one of them
  // visible and individually tappable.
  //
  // The horizontal radius is solved from the arena width rather than fixed,
  // because a rotated card is much wider than a square one (a 176x256 card at
  // 11 degrees is ~222px across) and a fixed radius overflows on every phone.
  // The dome is then shifted up by half its depth so the *bounding box* is
  // centred rather than the arc.
  const computePositions = useCallback(
    (ids: string[]): Record<string, CardPosition> => {
      const { width, height } = getContainerSize();
      const result: Record<string, CardPosition> = {};
      const count = ids.length;
      if (count === 0) return result;

      const cx = width / 2;
      const cy = height / 2;

      const { w: cardW, h: cardH } = CARD_DIMENSIONS[DECK_SIZE];
      const rotRad = (DOME_ROTATE * Math.PI) / 180;
      // Half-extent of the card's bounding box once rotated.
      const halfW = (cardW / 2) * Math.cos(rotRad) + (cardH / 2) * Math.sin(rotRad);
      const halfH = (cardW / 2) * Math.sin(rotRad) + (cardH / 2) * Math.cos(rotRad);

      if (count === 1) {
        const { x, y } = centerOf(cx, cy, DECK_SIZE);
        result[ids[0]] = { x, y, rotate: 0, scale: 1, opacity: 1, filter: "none" };
        return result;
      }

      // Widest fan whose rotated corners still clear the arena sides.
      const radiusX = Math.min(
        Math.max(0, width - DOME_PAD * 2 - halfW * 2) / 2 / Math.sin(DOME_HALF_ANGLE),
        DOME_MAX_RADIUS_X
      );
      // Dome depth, capped so it never exceeds a card height and always leaves
      // room for the rotated box.
      const roomForDroop = height - DOME_PAD * 2 - halfH * 2;
      const droop = Math.max(
        DOME_MIN_DROOP,
        Math.min(roomForDroop, cardH * DOME_DROOP_RATIO)
      );
      const radiusY = droop / (1 - Math.cos(DOME_HALF_ANGLE));

      // Centre the bounding box, not the arc.
      const originY = cy - droop / 2;

      ids.forEach((id, i) => {
        // t runs -1 (left) .. 1 (right) across the fan.
        const t = (i / (count - 1)) * 2 - 1;
        const angle = t * DOME_HALF_ANGLE;
        const { x, y } = centerOf(
          cx + radiusX * Math.sin(angle),
          originY + radiusY * (1 - Math.cos(angle)),
          DECK_SIZE
        );

        result[id] = {
          x,
          y,
          rotate: t * DOME_ROTATE,
          scale: 1,
          opacity: 1,
          filter: "none",
        };
      });
      return result;
    },
    [getContainerSize]
  );

  // A single random position for the shuffle. Cards riffle around the centre
  // Shuffle positions for the whole deck at one point in time.
  //
  // Every card sits at its own phase of a single top-to-bottom loop, evenly
  // spaced across the cycle. The result is a continuous cascade: one card
  // leaving the top of the stack as another settles at the bottom. Motion is
  // driven by the tick rather than by Math.random, so a card always advances
  // instead of hopping back to where it started.
  const computeShufflePositions = useCallback(
    (ids: string[], tick: number, size: CardSize = DECK_SIZE): Record<string, CardPosition> => {
      const { width, height } = getContainerSize();
      const cx = width / 2;
      const cy = height / 2;
      const count = ids.length || 1;

      const result: Record<string, CardPosition> = {};

      ids.forEach((id, i) => {
        // Even slice of the cycle per card, so the deck always looks like a
        // stream rather than a block moving together.
        const phase = (tick * SHUFFLE_SPEED + i / count) % 1;
        // Ease so the card accelerates off the top and settles at the bottom.
        const eased = phase * phase * (3 - 2 * phase);

        const y = cy - SHUFFLE_TRAVEL / 2 + eased * SHUFFLE_TRAVEL;
        const { x, y: top } = centerOf(
          cx + (Math.random() * 2 - 1) * SHUFFLE_X_JITTER,
          y,
          size
        );

        result[id] = {
          x,
          y: top,
          // Slight lean into the direction of travel, plus a little settle.
          rotate: (Math.random() * 2 - 1) * SHUFFLE_ROT_JITTER + (phase - 0.5) * 3,
          // Shrink very slightly as it travels down, so cards read as moving
          // away in depth before they come back to the top.
          scale: 1 - phase * 0.05,
          opacity: 1,
          filter: "none",
        };
      });

      return result;
    },
    [getContainerSize]
  );

  // Where the status line goes: just below the dome's lower edge, clamped so it
  // always stays inside the arena. Derived from the same geometry as the cards,
  // so it can never overlap the fan.
  const statusTextTop = useMemo(() => {
    const count = visibleCardIds.length;
    if (count === 0) return "calc(50% + 160px)";

    const { height } = getContainerSize();
    const { h: cardH } = CARD_DIMENSIONS[DECK_SIZE];
    const rotRad = (DOME_ROTATE * Math.PI) / 180;
    const { w: cardW } = CARD_DIMENSIONS[DECK_SIZE];
    const halfH = (cardW / 2) * Math.sin(rotRad) + (cardH / 2) * Math.cos(rotRad);

    // The dome's outer cards sit `droop` below the centre card, and the whole
    // fan is shifted up by half that, so the lowest card's bottom edge is at
    // height/2 + droop/2 + halfH.
    const roomForDroop = height - DOME_PAD * 2 - halfH * 2;
    const droop =
      count === 1
        ? 0
        : Math.max(DOME_MIN_DROOP, Math.min(roomForDroop, cardH * DOME_DROOP_RATIO));

    const lowest = height / 2 + droop / 2 + halfH;
    const clamped = Math.min(lowest + 20, height - 40);
    return `${Math.max(0, clamped)}px`;
  }, [visibleCardIds, getContainerSize]);

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

      const shuffleSize = DECK_SIZE;
      shuffleTickRef.current = 0;

      // Shuffle animation: a tick-driven cascade rather than random jitter.
      const interval = window.setInterval(() => {
        shuffleTickRef.current += 1;
        setPositions(computeShufflePositions(visible, shuffleTickRef.current, shuffleSize));
      }, reducedMotion ? 80 : 110);

      const duration = reducedMotion ? 1200 : 2500;
      timerRef.current = window.setTimeout(() => {
        clearInterval(interval);
        setPositions((prev) => computePositions(Object.keys(prev)));
        setPhase("selecting");
      }, duration);
    },
    [computePositions, computeShufflePositions, sound, reducedMotion]
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

      // The chosen card becomes the only thing on screen: it lifts to the
      // centre and scales up, and the rest of the deck is hidden entirely so
      // the reveal is never competing with other cards.
      setPositions((prev) => {
        const next = { ...prev };
        const { width, height } = getContainerSize();
        const centered = centerOf(width / 2, height / 2, DECK_SIZE);
        Object.keys(next).forEach((key) => {
          if (key === id) {
            next[key] = {
              x: centered.x,
              y: centered.y,
              rotate: 0,
              scale: 1.12,
              opacity: 1,
              filter: "none",
            };
          } else {
            // Fully hidden: the deck collapses away rather than lingering
            // dimmed behind the revealed card.
            next[key] = {
              ...next[key],
              x: centered.x,
              y: centered.y,
              rotate: 0,
              scale: 0.9,
              opacity: 0,
              filter: "none",
            };
          }
        });
        return next;
      });

      setPhase("revealing");

      // The card just drawn, for persisting the completed reading below.
      const drawnCard = { cardId: id, orientation, position };

      // After reveal, check if more cards needed
      timerRef.current = window.setTimeout(() => {
        if (currentStep + 1 >= numCards) {
          setShowResult(true);
          setResultTransitioning(true);
          sound?.reveal();

          // Persist now that the reading is complete, so the "saved to
          // history" note on the result screen is accurate.
          const complete = [...selectedCards, drawnCard];
          saveReadingToStorage({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            readingType,
            category: getReadingTypeLabel(readingType),
            question: "",
            cards: complete.map((c) => ({
              position: c.position,
              cardName: getCardById(c.cardId)?.name ?? "Unknown",
              cardId: c.cardId,
              orientation: c.orientation,
            })),
            timestamp: Date.now(),
          });
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
    [phase, selectedCardId, selectedCards, readingType, currentStep, numCards, recentCardIds, getContainerSize, sound, reducedMotion]
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

      const shuffleSize = DECK_SIZE;
      shuffleTickRef.current = 0;

      // Shuffle animation
      const interval = window.setInterval(() => {
        shuffleTickRef.current += 1;
        setPositions(computeShufflePositions(visible, shuffleTickRef.current, shuffleSize));
      }, reducedMotion ? 80 : 110);

      const duration = reducedMotion ? 1200 : 2500;
      timerRef.current = window.setTimeout(() => {
        clearInterval(interval);
        setPositions((prev) => computePositions(Object.keys(prev)));
        setPhase("selecting");
      }, duration);
    }, reducedMotion ? 300 : 500);
  }, [computePositions, computeShufflePositions, sound, reducedMotion]);

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

      const shuffleSize = DECK_SIZE;
      shuffleTickRef.current = 0;

      const interval = window.setInterval(() => {
        shuffleTickRef.current += 1;
        setPositions(computeShufflePositions(visible, shuffleTickRef.current, shuffleSize));
      }, reducedMotion ? 80 : 110);

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
                  className="glass p-4 sm:p-5 rounded-xl text-center hover:border-gold-400/30 transition-[color,background-color,border-color,box-shadow,transform] duration-300 min-h-[100px] flex flex-col items-center justify-center touch-manipulation"
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
                  size={DECK_SIZE}
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

            {/* Card display.
                The drawn cards share the available width instead of using
                fixed pixel sizes: the previous fixed w-28 slot with a w-36
                card overflowed the slot and lapped onto its neighbour — by
                48px on a 440px screen and 168px on a 320px one. flex-1 with
                min-w-0 divides the row evenly, and the 2:3 aspect ratio keeps
                the cards proportional however narrow the screen gets. */}
            <motion.div
              className="w-full flex justify-center items-start gap-2 sm:gap-3 my-4 px-4"
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
                    className="flex-1 min-w-0 max-w-[184px] aspect-[2/3]"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  >
                    <MiniAppCard
                      card={data}
                      orientation={sc.orientation}
                      isRevealed={true}
                      size="fluid"
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
