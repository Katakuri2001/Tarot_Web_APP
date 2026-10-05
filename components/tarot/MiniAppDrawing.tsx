"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useReducedMotion, useSoundEnabled } from "@/hooks/useShared";
import { useSound } from "@/services/soundService";
import { tarotCards } from "@/data/tarotCards";
import {
  getCardById,
  shuffleArray,
  generateOrientation,
} from "@/utils/tarotUtils";
import { saveReadingToStorage } from "@/services/readingService";
import MiniAppCard from "@/components/tarot/MiniAppCard";
import type { Orientation, TarotCategory, SpreadCard } from "@/data/types";
import {
  TAROT_CATEGORIES,
  TAROT_POSITIONS,
  getCategoryMeta,
  getPositionMeta,
  getCategoryCardReading,
  composeOverallReading,
} from "@/utils/tarotReading";

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

const DECK_SIZE: CardSize = "lg";

const SHUFFLE_TRAVEL = 88;
const SHUFFLE_SPEED = 0.085;
const SHUFFLE_X_JITTER = 7;
const SHUFFLE_ROT_JITTER = 5;

const DOME_HALF_ANGLE = (45 * Math.PI) / 180;
const DOME_ROTATE = 11;
const DOME_MAX_RADIUS_X = 220;
const DOME_MIN_DROOP = 24;
const DOME_DROOP_RATIO = 0.58;
const DOME_PAD = 10;

const CARD_DIMENSIONS: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 112, h: 160 },
  md: { w: 144, h: 208 },
  lg: { w: 176, h: 256 },
};

/** Visual size of a slotted card in the in-draw spread row. */
const SLOT_W = 64;
const SLOT_SCALE = SLOT_W / CARD_DIMENSIONS.lg.w;

const centerOf = (cx: number, cy: number, size: CardSize): { x: number; y: number } => ({
  x: cx - CARD_DIMENSIONS[size].w / 2,
  y: cy - CARD_DIMENSIONS[size].h / 2,
});

type Phase =
  | "category"
  | "intro"
  | "shuffling"
  | "selecting"
  | "revealing"
  | "placing"
  | "result";

interface Props {
  /** Pre-select a category and skip the category-selection screen. */
  initialCategory?: TarotCategory;
  /** Fill the parent instead of the viewport (used by the phone preview). */
  embedded?: boolean;
}

export default function MiniAppDrawing({ initialCategory, embedded = false }: Props) {
  const reducedMotion = useReducedMotion();
  const [soundEnabled] = useSoundEnabled();
  const sound = useSound(soundEnabled);
  const router = useRouter();

  const shuffleTickRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRowRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>(initialCategory ? "intro" : "category");
  const [category, setCategory] = useState<TarotCategory | null>(initialCategory ?? null);
  const [step, setStep] = useState(0); // 0..2
  const [drawn, setDrawn] = useState<SpreadCard[]>([]);
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>("upright");
  const [lastSpreadIds, setLastSpreadIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const positionMeta = TAROT_POSITIONS[step] ?? TAROT_POSITIONS[0];
  const categoryMeta = category ? getCategoryMeta(category) : null;

  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { width: 360, height: 600 };
    return {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    };
  }, []);

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
      const halfW = (cardW / 2) * Math.cos(rotRad) + (cardH / 2) * Math.sin(rotRad);
      const halfH = (cardW / 2) * Math.sin(rotRad) + (cardH / 2) * Math.cos(rotRad);

      if (count === 1) {
        const { x, y } = centerOf(cx, cy, DECK_SIZE);
        result[ids[0]] = { x, y, rotate: 0, scale: 1, opacity: 1, filter: "none" };
        return result;
      }

      const radiusX = Math.min(
        Math.max(0, width - DOME_PAD * 2 - halfW * 2) / 2 / Math.sin(DOME_HALF_ANGLE),
        DOME_MAX_RADIUS_X
      );
      const roomForDroop = height - DOME_PAD * 2 - halfH * 2;
      const droop = Math.max(DOME_MIN_DROOP, Math.min(roomForDroop, cardH * DOME_DROOP_RATIO));
      const radiusY = droop / (1 - Math.cos(DOME_HALF_ANGLE));
      const originY = cy - droop / 2;

      ids.forEach((id, i) => {
        const t = (i / (count - 1)) * 2 - 1;
        const angle = t * DOME_HALF_ANGLE;
        const { x, y } = centerOf(
          cx + radiusX * Math.sin(angle),
          originY + radiusY * (1 - Math.cos(angle)),
          DECK_SIZE
        );
        result[id] = { x, y, rotate: t * DOME_ROTATE, scale: 1, opacity: 1, filter: "none" };
      });
      return result;
    },
    [getContainerSize]
  );

  const computeShufflePositions = useCallback(
    (ids: string[], tick: number): Record<string, CardPosition> => {
      const { width, height } = getContainerSize();
      const cx = width / 2;
      const cy = height / 2;
      const count = ids.length || 1;
      const result: Record<string, CardPosition> = {};
      ids.forEach((id, i) => {
        const phase = (tick * SHUFFLE_SPEED + i / count) % 1;
        const eased = phase * phase * (3 - 2 * phase);
        const y = cy - SHUFFLE_TRAVEL / 2 + eased * SHUFFLE_TRAVEL;
        const { x, y: top } = centerOf(cx + (Math.random() * 2 - 1) * SHUFFLE_X_JITTER, y, DECK_SIZE);
        result[id] = {
          x,
          y: top,
          rotate: (Math.random() * 2 - 1) * SHUFFLE_ROT_JITTER + (phase - 0.5) * 3,
          scale: 1 - phase * 0.05,
          opacity: 1,
          filter: "none",
        };
      });
      return result;
    },
    [getContainerSize]
  );

  const statusTextTop = useMemo(() => {
    const count = visibleCardIds.length;
    if (count === 0) return "calc(50% + 160px)";
    const { height } = getContainerSize();
    const { h: cardH } = CARD_DIMENSIONS[DECK_SIZE];
    const rotRad = (DOME_ROTATE * Math.PI) / 180;
    const { w: cardW } = CARD_DIMENSIONS[DECK_SIZE];
    const halfH = (cardW / 2) * Math.sin(rotRad) + (cardH / 2) * Math.cos(rotRad);
    const roomForDroop = height - DOME_PAD * 2 - halfH * 2;
    const droop = count === 1 ? 0 : Math.max(DOME_MIN_DROOP, Math.min(roomForDroop, cardH * DOME_DROOP_RATIO));
    const lowest = height / 2 + droop / 2 + halfH;
    const clamped = Math.min(lowest + 36, height - 30);
    return `${Math.max(0, clamped)}px`;
  }, [visibleCardIds, getContainerSize]);

  /** Candidate deck ids for the next draw: unique within spread, last spread avoided. */
  const pickVisibleIds = useCallback(
    (currentDrawn: SpreadCard[]): string[] => {
      const exclude = new Set([...currentDrawn.map((d) => d.cardId), ...lastSpreadIds]);
      let pool = tarotCards.map((c) => c.id).filter((id) => !exclude.has(id));
      if (pool.length < NUM_VISIBLE) {
        // Degenerate guard: widen the pool rather than deadlock.
        pool = tarotCards.map((c) => c.id).filter((id) => !currentDrawn.some((d) => d.cardId === id));
      }
      return shuffleArray(pool).slice(0, NUM_VISIBLE);
    },
    [lastSpreadIds]
  );

  const runShuffleBeat = useCallback(
    (ids: string[], duration: number) => {
      shuffleTickRef.current = 0;
      setPositions(computeShufflePositions(ids, 0));
      intervalRef.current = window.setInterval(() => {
        shuffleTickRef.current += 1;
        setPositions(computeShufflePositions(ids, shuffleTickRef.current));
      }, reducedMotion ? 80 : 110);
      timerRef.current = window.setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPositions(computePositions(ids));
        setPhase("selecting");
      }, duration);
    },
    [computePositions, computeShufflePositions, reducedMotion]
  );

  /** Full shuffling beat for the start of a new card draw. */
  const startStep = useCallback(
    (stepIndex: number, currentDrawn: SpreadCard[]) => {
      setStep(stepIndex);
      setSelectedCardId(null);
      const visible = pickVisibleIds(currentDrawn);
      setVisibleCardIds(visible);
      setPhase("shuffling");
      sound?.shuffle();
      runShuffleBeat(visible, reducedMotion ? 1200 : 2200);
    },
    [pickVisibleIds, runShuffleBeat, sound, reducedMotion]
  );

  const beginReading = useCallback(() => {
    setDrawn([]);
    setSaved(false);
    startStep(0, []);
  }, [startStep]);

  const selectCard = useCallback(
    (id: string) => {
      if (phase !== "selecting" || selectedCardId) return;
      const card = getCardById(id);
      if (!card) return;

      const orientation = generateOrientation();
      setSelectedCardId(id);
      setSelectedOrientation(orientation);
      setPhase("revealing");
      sound?.flip();

      // Selected card becomes the hero in the centre; the rest recede.
      setPositions((prev) => {
        const next = { ...prev };
        const { width, height } = getContainerSize();
        const centered = centerOf(width / 2, height / 2, DECK_SIZE);
        Object.keys(next).forEach((key) => {
          if (key === id) {
            next[key] = { x: centered.x, y: centered.y, rotate: 0, scale: 1.12, opacity: 1, filter: "none" };
          } else {
            next[key] = { ...next[key], x: centered.x, y: centered.y, rotate: 0, scale: 0.9, opacity: 0, filter: "none" };
          }
        });
        return next;
      });

      // After the flip, fly the card into its spread slot.
      timerRef.current = window.setTimeout(() => {
        setPhase("placing");
        const arena = containerRef.current?.getBoundingClientRect();
        const slot = slotRefs.current[step]?.getBoundingClientRect();
        setPositions((prev) => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          if (arena && slot) {
            const cx = slot.left - arena.left + slot.width / 2;
            const cy = slot.top - arena.top + slot.height / 2;
            next[id] = { x: cx - CARD_DIMENSIONS.lg.w / 2, y: cy - CARD_DIMENSIONS.lg.h / 2, rotate: 0, scale: SLOT_SCALE, opacity: 1, filter: "none" };
          } else {
            next[id] = { ...prev[id], scale: SLOT_SCALE, y: prev[id].y - 120, opacity: 1 };
          }
          return next;
        });

        timerRef.current = window.setTimeout(() => {
          const spreadCard: SpreadCard = {
            cardId: id,
            orientation,
            position: positionMeta.id,
          };
          const nextDrawn = [...drawn, spreadCard];
          setDrawn(nextDrawn);
          sound?.reveal();

          if (nextDrawn.length >= 3) {
            setLastSpreadIds(nextDrawn.map((d) => d.cardId));
            const cardsForSave = nextDrawn.map((sc) => ({
              position: getPositionMeta(sc.position).label,
              cardName: getCardById(sc.cardId)?.name ?? "Unknown",
              cardId: sc.cardId,
              orientation: sc.orientation,
            }));
            saveReadingToStorage({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              readingType: "general",
              category: categoryMeta?.label ?? "General",
              question: "",
              cards: cardsForSave,
              timestamp: Date.now(),
            });
            setSaved(true);
            setVisibleCardIds([]);
            setPositions({});
            setSelectedCardId(null);
            setPhase("result");
          } else {
            setSelectedCardId(null);
            startStep(nextDrawn.length, nextDrawn);
          }
        }, reducedMotion ? 350 : 750);
      }, reducedMotion ? 400 : 1300);
    },
    [phase, selectedCardId, drawn, positionMeta, getContainerSize, sound, reducedMotion, startStep, step, categoryMeta, setSaved]
  );

  const drawAgain = useCallback(() => {
    setSaved(false);
    beginReading();
  }, [beginReading]);

  const changeCategory = useCallback(() => {
    setCategory(null);
    setDrawn([]);
    setStep(0);
    setSaved(false);
    setVisibleCardIds([]);
    setPositions({});
    setSelectedCardId(null);
    setPhase("category");
  }, []);

  // Clear timers on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Resize observer: keep the deck centred when the container changes size.
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
      if (phase === "revealing" || phase === "placing" || phase === "result") return;
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
  }, [computePositions, phase]);

  const isClickable = phase === "selecting" && !selectedCardId;

  const overallReading = useMemo(() => {
    if (phase !== "result" || !category || drawn.length !== 3) return "";
    return composeOverallReading(category, drawn, getCardById, (sc) => {
      const card = getCardById(sc.cardId);
      return card ? getCategoryCardReading(card, sc.orientation, category, sc.position) : "";
    });
  }, [phase, category, drawn]);

  const inDrawPhase =
    phase === "shuffling" || phase === "selecting" || phase === "revealing" || phase === "placing";

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
            onClick={() => (phase === "category" ? router.push("/") : changeCategory())}
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
        {inDrawPhase ? (
          <div className="flex items-center gap-1.5 px-2" aria-label={`Card ${step + 1} of 3`}>
            {TAROT_POSITIONS.map((p, i) => (
              <span
                key={p.id}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                  i < drawn.length ? "bg-gold-300" : i === step ? "bg-gold-300/60" : "bg-warmwhite/15"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="w-8" />
        )}
      </motion.header>

      <AnimatePresence mode="wait">
        {/* ---------- Category selection ---------- */}
        {phase === "category" && (
          <motion.div
            key="category"
            className="flex-1 flex flex-col items-center justify-center px-5 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1
              className="font-serif-display text-3xl text-warmwhite mb-2 text-center"
              style={{ fontWeight: 300 }}
            >
              What would you like to know?
            </h1>
            <p className="text-moonlight text-sm mb-8 text-center max-w-xs">
              Choose a path for your three-card reading.
            </p>
            <div className="w-full max-w-sm space-y-2.5">
              {TAROT_CATEGORIES.map((c, i) => (
                <motion.button
                  key={c.id}
                  className={`w-full glass rounded-xl px-4 py-3.5 flex items-center gap-4 text-left transition-[color,background-color,border-color,box-shadow,transform] duration-300 min-h-[56px] touch-manipulation ${
                    category === c.id
                      ? "border-gold-400/60 shadow-[0_0_24px_rgba(212,184,90,0.15)] -translate-y-0.5"
                      : "border-gold-400/10 hover:border-gold-400/30"
                  }`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCategory(c.id);
                    timerRef.current = window.setTimeout(() => setPhase("intro"), 450);
                  }}
                  aria-pressed={category === c.id}
                >
                  <span className="text-xl text-gold-300 w-6 text-center">{c.icon}</span>
                  <span className="flex-1">
                    <span className="block font-serif-display text-lg text-warmwhite leading-tight">{c.label}</span>
                    <span className="block text-[11px] text-muted tracking-wide">{c.tagline}</span>
                  </span>
                  <span className="text-gold-300/50 text-sm">→</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ---------- Category confirmation ---------- */}
        {phase === "intro" && categoryMeta && (
          <motion.div
            key="intro"
            className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-gold-300/70 tracking-[0.3em] uppercase text-xs mb-5">Your Reading</p>
            <div className="text-4xl text-gold-300 mb-3">{categoryMeta.icon}</div>
            <h2 className="font-serif-display text-3xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              {categoryMeta.label}
            </h2>
            <p className="text-moonlight text-sm leading-relaxed max-w-xs mb-10">
              Three cards will reveal the energy, influences and guidance
              surrounding this area of your life.
            </p>
            <motion.button
              onClick={beginReading}
              className="px-10 py-3.5 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm min-h-[44px] touch-manipulation"
              whileTap={{ scale: 0.96 }}
            >
              Begin Reading
            </motion.button>
            <button
              onClick={changeCategory}
              className="mt-4 text-muted text-xs tracking-wider uppercase hover:text-gold-300 transition-colors min-h-[44px] px-4"
            >
              Change category
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Drawing arena ---------- */}
      {inDrawPhase && (
        <div ref={containerRef} className="flex-1 relative z-10 min-h-0">
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
                const isRevealed = phase === "placing" && cardId === selectedCardId;
                const pos =
                  positions[cardId] || { x: 100, y: 100, rotate: 0, scale: 1, opacity: 1, filter: "none" };
                return (
                  <MiniAppCard
                    key={cardId}
                    card={card}
                    orientation={
                      cardId === selectedCardId && (phase === "revealing" || phase === "placing")
                        ? selectedOrientation
                        : "upright"
                    }
                    position={pos}
                    layout="absolute"
                    isRevealed={phase === "revealing" || isRevealed ? cardId === selectedCardId : false}
                    isClickable={isClickable}
                    index={i}
                    size={DECK_SIZE}
                    onSelect={() => selectCard(cardId)}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* Placed spread history */}
          <div ref={slotRowRef} className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {TAROT_POSITIONS.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  className={`rounded-md overflow-hidden ${
                    drawn[i]
                      ? "ring-1 ring-gold-400/40"
                      : "border border-dashed border-warmwhite/15"
                  }`}
                  style={{ width: SLOT_W, aspectRatio: "2/3" }}
                >
                  {drawn[i] ? (
                    <MiniAppCard
                      card={getCardById(drawn[i].cardId)!}
                      orientation={drawn[i].orientation}
                      isRevealed
                      size="fluid"
                    />
                  ) : null}
                </div>
                <span className="text-[9px] tracking-widest uppercase text-muted">
                  {p.label.split(" /")[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Status text */}
          <AnimatePresence mode="wait">
            {(phase === "selecting" || phase === "revealing" || phase === "placing") && (
              <motion.div
                className="absolute text-center z-30 pointer-events-none w-full px-4"
                style={{ top: statusTextTop, x: "-50%", left: "50%" }}
                key={phase + step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-gold-300 tracking-widest uppercase text-xs">
                  {phase === "selecting"
                    ? `${positionMeta.step} · ${positionMeta.label}`
                    : phase === "revealing"
                    ? "Revealing…"
                    : "Placing…"}
                </p>
                {phase === "selecting" && (
                  <p className="text-moonlight text-xs mt-1.5 max-w-[240px] mx-auto">
                    {positionMeta.prompt}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ---------- Result ---------- */}
      <AnimatePresence>
        {phase === "result" && category && drawn.length === 3 && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center bg-deepnight/95 backdrop-blur-lg overflow-y-auto"
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-full px-4 pt-5 pb-2 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-gold-300/70 tracking-[0.3em] uppercase text-[10px] mb-2">Your Tarot Reading</p>
              <span className="font-serif-display text-2xl text-gold-300">
                {categoryMeta?.icon} {categoryMeta?.label}
              </span>
            </motion.div>

            {/* Three-card spread */}
            <motion.div
              className="w-full flex justify-center items-start gap-2 sm:gap-3 my-4 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {drawn.map((sc, i) => {
                const data = getCardById(sc.cardId);
                if (!data) return null;
                return (
                  <motion.div
                    key={sc.cardId}
                    className="flex-1 min-w-0 max-w-[184px] flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  >
                    <div className="w-full aspect-[2/3]">
                      <MiniAppCard card={data} orientation={sc.orientation} isRevealed size="fluid" />
                    </div>
                    <div className="text-center">
                      <p className="font-serif-display text-warmwhite text-sm leading-tight">{data.name}</p>
                      <p className="text-[10px] tracking-widest uppercase text-gold-300/80 mt-0.5">
                        {sc.orientation}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{getPositionMeta(sc.position).label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Card-by-card reading */}
            <motion.div
              className="w-full max-w-md px-4 mb-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {drawn.map((sc, i) => {
                const data = getCardById(sc.cardId);
                if (!data) return null;
                const reading = getCategoryCardReading(data, sc.orientation, category, sc.position);
                const posMeta = getPositionMeta(sc.position);
                return (
                  <div key={sc.cardId} className="glass p-4 sm:p-5 rounded-xl">
                    <p className="text-gold-300/60 text-[10px] tracking-[0.25em] uppercase mb-1.5">
                      0{i + 1} — {posMeta.label}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-serif-display text-lg text-warmwhite">{data.name}</h3>
                      <span className="text-xs text-gold-300 bg-gold-400/10 px-2 py-0.5 rounded-full">
                        {sc.orientation === "reversed" ? "Reversed" : "Upright"}
                      </span>
                    </div>
                    <p className="text-moonlight text-sm leading-relaxed mb-2">{reading}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {data.keywords.slice(0, 4).map((k) => (
                        <span
                          key={k}
                          className="text-[10px] tracking-wider bg-gold-400/10 text-gold-300 px-2 py-0.5 rounded-full"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="text-coolgray text-xs italic">{data.advice}</p>
                  </div>
                );
              })}

              {/* Overall reading */}
              <div className="glass p-4 sm:p-5 rounded-xl border border-gold-400/20">
                <p className="text-gold-300/60 text-[10px] tracking-[0.25em] uppercase mb-1.5">Overall Reading</p>
                <p className="text-warmwhite text-sm leading-relaxed">{overallReading}</p>
                {category === "health" && (
                  <p className="text-muted text-[11px] mt-3 leading-relaxed">
                    Tarot offers reflective guidance and is not medical advice. For health concerns,
                    always consult a qualified professional.
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              className="px-4 pb-10 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button
                onClick={drawAgain}
                className="px-8 py-3.5 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors touch-manipulation min-h-[44px]"
                whileTap={{ scale: 0.96 }}
              >
                ↻ Draw Again
              </motion.button>
              <button
                onClick={changeCategory}
                className="text-muted text-xs tracking-wider uppercase hover:text-gold-300 transition-colors min-h-[44px] px-4"
              >
                Change Category
              </button>
              {saved && <p className="text-muted text-xs">Your reading was saved to history.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
