"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  generateReadingId,
} from "@/utils/tarotUtils";
import { saveReadingToStorage } from "@/services/readingService";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import type { ReadingType, Orientation, CardInReading } from "@/data/types";

type CardPosition = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  filter: string;
};

const INTRO_LINES = ["Your reading begins.", "Clear your mind.", "Trust your intuition.", "Choose a card."];

interface TarotTableProps {
  readingType: ReadingType;
  onNewReading?: () => void;
}

export default function TarotTable({ readingType, onNewReading }: TarotTableProps) {
  const reducedMotion = useReducedMotion();
  const [soundEnabled] = useSoundEnabled();
  const sound = useSound(soundEnabled);
  const router = useRouter();

  const [phase, setPhase] = useState<"setup" | "intro" | "shuffling" | "spread" | "selected" | "flipping" | "revealed" | "result">("setup");
  const [question, setQuestion] = useState("");
  const [deck, setDeck] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardInReading[]>([]);
  const [step, setStep] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [size, setSize] = useState({ width: 900, height: 700 });
  const [isLocked, setIsLocked] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const readingIdRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const shuffleIntervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const savedRef = useRef(false);
  const selectedCardsRef = useRef(selectedCards);

  const numCards = readingType === "daily" ? 1 : 3;
  const visibleCount = reducedMotion ? 4 : 7;

  useEffect(() => {
    selectedCardsRef.current = selectedCards;
  }, [selectedCards]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const centerX = size.width / 2;
  const centerY = size.height * 0.42;

  const computeSpreadPositions = useCallback(
    (ids: string[]): Record<string, CardPosition> => {
      const count = ids.length;
      const positions: Record<string, CardPosition> = {};
      const radius = Math.min(size.width, size.height) * 0.22;
      ids.forEach((id, i) => {
        const angle = -60 + (120 / (count - 1 || 1)) * i;
        const rad = angle * (Math.PI / 180);
        positions[id] = {
          x: centerX + radius * Math.sin(rad) - 70,
          y: centerY - radius * Math.cos(rad) - 100,
          rotate: angle * 0.6,
          scale: 1,
          opacity: 1,
          filter: "none",
        };
      });
      return positions;
    },
    [centerX, centerY, size]
  );

  const randomPosition = useCallback((): CardPosition => {
    const x = Math.random() * Math.max(10, size.width - 150);
    const y = Math.random() * Math.max(10, size.height - 200);
    const rotate = (Math.random() - 0.5) * 60;
    const scale = 0.8 + Math.random() * 0.2;
    return { x, y, rotate, scale, opacity: 1, filter: "none" };
  }, [size]);

  const startReading = useCallback(() => {
    const allIds = shuffleArray(tarotCards.map((c) => c.id));
    const visible = shuffleArray(allIds).slice(0, visibleCount);
    setDeck(allIds);
    setVisibleCardIds(visible);
    setPositions(computeSpreadPositions(visible));
    setSelectedCards([]);
    setStep(0);
    setSelectedCardId(null);
    setReadingId(null);
    setIsLocked(false);
    setIntroStep(0);
    setPhase("intro");
  }, [computeSpreadPositions, visibleCount]);

  const selectCard = useCallback(
    (id: string) => {
      if (phase !== "spread" || isLocked) return;
      setIsLocked(true);
      setSelectedCardId(id);
      sound?.flip();

      const orientation = generateOrientation();
      const newSelection: CardInReading = {
        position: getReadingTypePositions(readingType)[step]?.position || "past",
        cardId: id,
        orientation,
      };
      const updated = [...selectedCards, newSelection];
      setSelectedCards(updated);

      if (!readingIdRef.current) {
        readingIdRef.current = generateReadingId();
        setReadingId(readingIdRef.current);
      }

      setPositions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key === id) {
            next[key] = { ...next[key], x: centerX - 80, y: centerY - 120, rotate: 0, scale: 1.2, opacity: 1, filter: "none" };
          } else {
            next[key] = { ...next[key], scale: 0.8, opacity: 0.15, filter: "blur(4px) brightness(0.4)" };
          }
        });
        return next;
      });

      setPhase("selected");
      timerRef.current = window.setTimeout(() => {
        setPhase("flipping");
      }, reducedMotion ? 200 : 500);
    },
    [phase, isLocked, step, readingType, centerX, centerY, sound, reducedMotion]
  );

  const nextStep = useCallback(() => {
    if (step + 1 >= numCards) {
      setPhase("result");
      return;
    }
    setStep((prev) => prev + 1);
    setSelectedCardId(null);
    setIsLocked(true);
    const available = deck.filter((id) => !selectedCardsRef.current.some((c) => c.cardId === id));
    const nextVisible = shuffleArray(available).slice(0, visibleCount);
    setVisibleCardIds(nextVisible);
    setPositions(computeSpreadPositions(nextVisible));
    sound?.shuffle();
    timerRef.current = window.setTimeout(() => {
      setPhase("spread");
      setIsLocked(false);
    }, reducedMotion ? 200 : 500);
  }, [step, numCards, deck, computeSpreadPositions, visibleCount, sound, reducedMotion]);

  // Intro sequence
  useEffect(() => {
    if (phase !== "intro") return;
    timerRef.current = window.setTimeout(() => {
      if (introStep >= INTRO_LINES.length - 1) {
        setPhase("shuffling");
      } else {
        setIntroStep((prev) => prev + 1);
      }
    }, reducedMotion ? 800 : 1400);
    return () => clearTimeout(timerRef.current);
  }, [phase, introStep, reducedMotion]);

  // Shuffle sequence
  useEffect(() => {
    if (phase !== "shuffling") return;
    sound?.shuffle();
    const interval = window.setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          const pos = randomPosition();
          next[id] = { ...next[id], ...pos };
        });
        return next;
      });
    }, reducedMotion ? 80 : 120);

    const duration = reducedMotion ? 1200 : 2500;
    const timeout = window.setTimeout(() => {
      clearInterval(interval);
      setPositions((prev) => computeSpreadPositions(Object.keys(prev)));
      setPhase("spread");
      setIsLocked(true);
      window.setTimeout(() => setIsLocked(false), 600);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, randomPosition, computeSpreadPositions, reducedMotion]);

  // Selected -> flipping
  useEffect(() => {
    if (phase !== "selected") return;
    timerRef.current = window.setTimeout(() => setPhase("flipping"), reducedMotion ? 150 : 300);
    return () => clearTimeout(timerRef.current);
  }, [phase, reducedMotion]);

  // Flipping -> revealed
  useEffect(() => {
    if (phase !== "flipping") return;
    sound?.reveal();
    timerRef.current = window.setTimeout(() => setPhase("revealed"), reducedMotion ? 300 : 800);
    return () => clearTimeout(timerRef.current);
  }, [phase, sound, reducedMotion]);

  // Revealed -> next or result
  useEffect(() => {
    if (phase !== "revealed") return;
    const timeout = window.setTimeout(() => {
      if (step + 1 >= numCards) {
        setPhase("result");
      } else {
        nextStep();
      }
    }, reducedMotion ? 800 : 2000);
    return () => clearTimeout(timeout);
  }, [phase, step, numCards, nextStep, reducedMotion]);

  // Save reading on result
  useEffect(() => {
    if (phase === "result" && readingId && !savedRef.current) {
      saveReadingToStorage({
        id: readingId,
        readingType,
        category: getReadingTypeLabel(readingType),
        question,
        cards: selectedCards.map((c) => ({
          position: c.position,
          cardName: getCardById(c.cardId)?.name || c.cardId,
          cardId: c.cardId,
          orientation: c.orientation,
        })),
        timestamp: Date.now(),
      });
      savedRef.current = true;
    }
  }, [phase, readingId, readingType, question, selectedCards]);

  const handleShare = useCallback(() => {
    const cardNames = selectedCards
      .map((c) => getCardById(c.cardId)?.name)
      .filter(Boolean)
      .join(", ");
    const text = `I drew ${cardNames} during a ${getReadingTypeLabel(readingType)} reading at Velora.`;
    if (navigator.share) {
      navigator.share({ title: "Velora Reading", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Reading copied to clipboard!")).catch(() => {});
    }
  }, [selectedCards, readingType]);

  const handleNewReading = useCallback(() => {
    onNewReading?.();
  }, [onNewReading]);

  const getCardState = (cardId: string): "idle" | "selected" | "dimmed" | "revealed" => {
    if (phase === "revealed" || phase === "result" || phase === "flipping") return "revealed";
    if (phase === "selected") return cardId === selectedCardId ? "selected" : "dimmed";
    if (phase === "spread") return cardId === selectedCardId ? "selected" : "idle";
    return "idle";
  };

  const isClickable = phase === "spread" && !isLocked;

  return (
    <div className="fixed inset-0 z-40 bg-deepnight">
      <TarotParticles />
      <TarotCursorLight />

      {/* Atmospheric glows */}
      <div className="nebula w-96 h-96 bg-indigo-900/30 top-1/4 left-1/4" />
      <div className="nebula w-80 h-80 bg-gold-400/10 bottom-1/4 right-1/4 glow-pulse" />

      {/* Card arena */}
      <div ref={containerRef} className="relative z-20 w-full h-full flex flex-col items-center justify-center p-4">
        <div
        className="relative w-full h-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(26,10,62,0.35) 0%, rgba(6,6,15,0.95) 100%)",
        }}
      >
          <AnimatePresence mode="popLayout">
            {visibleCardIds.map((cardId, i) => {
              const card = getCardById(cardId);
              if (!card) return null;
              const state = getCardState(cardId);
              const pos = positions[cardId] || { x: centerX - 80, y: centerY - 120, rotate: 0, scale: 1, opacity: 1, filter: "none" };
              return (
                <TableCard
                  key={cardId}
                  card={card}
                  orientation={state === "revealed" ? (selectedCards.find((c) => c.cardId === cardId)?.orientation || "upright") : "upright"}
                  position={pos}
                  state={state}
                  phase={phase}
                  isClickable={isClickable && state === "idle"}
                  index={i}
                  onSelect={() => selectCard(cardId)}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {(phase === "spread" || phase === "selected") && (
            <motion.div
              key="status"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-gold-300 tracking-widest uppercase text-xs">
                {phase === "selected" ? "Flipping..." : numCards === 1 ? "Choose a card" : `Select ${Math.min(step + 1, numCards)} of ${numCards}`}
              </p>
              {phase === "spread" && numCards > 1 && (
                <p className="text-moonlight text-xs mt-1">{selectedCards.length} selected</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Setup overlay */}
      <AnimatePresence>
        {phase === "setup" && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-deepnight/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass p-5 sm:p-6 rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full text-center">
              <h2 className="font-serif-display text-3xl text-warmwhite mb-2">Velora</h2>
              <p className="text-gold-300 text-sm tracking-widest uppercase mb-6">{getReadingTypeLabel(readingType)} Reading</p>
              <label className="block text-moonlight text-sm mb-3 tracking-wider" htmlFor="question-input">
                Your question (optional)
              </label>
              <textarea
                id="question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask the cards?"
                className="w-full h-24 bg-midnight/50 border border-gold-400/10 rounded-xl p-4 text-warmwhite placeholder:text-muted text-sm focus:outline-none focus:border-gold-400/30 transition-colors resize-none"
                aria-label="Your question"
              />
              <div className="mt-6 flex justify-center">
                <button
                  onClick={startReading}
                  disabled={!question.trim()}
                  className="px-8 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Begin Reading
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro overlay */}
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-deepnight/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={introStep}
                className="font-serif-display text-2xl md:text-4xl text-warmwhite mb-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {INTRO_LINES[introStep]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result panel */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center p-6 bg-deepnight/92 backdrop-blur-lg overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Your Reading
            </motion.h2>
            <motion.p
              className="text-gold-300 text-sm tracking-widest uppercase mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {getReadingTypeLabel(readingType)}
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {selectedCards.map((c, i) => {
                const data = getCardById(c.cardId);
                if (!data) return null;
                return (
                  <motion.div
                    key={c.cardId}
                    className="w-40 h-60 sm:w-44 sm:h-64 md:w-48 md:h-72"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  >
                    <TarotCardRevealed card={data} orientation={c.orientation} />
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div
              className="max-w-3xl w-full space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {selectedCards.map((c, i) => (
                <ReadingDetails key={c.cardId} card={c} orientation={c.orientation} readingType={readingType} index={i} />
              ))}
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <button
                onClick={handleShare}
                className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 hover:bg-gold-400/5 transition-all"
              >
                Share Reading
              </button>
              <button
                onClick={handleNewReading}
                className="px-6 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors"
              >
                New Reading
              </button>
            </motion.div>
            <p className="text-moonlight text-xs mt-4">Saved to your history</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TarotCardRevealed({ card, orientation }: { card: typeof tarotCards[0]; orientation: Orientation }) {
  return (
    <div className="relative w-full h-full perspective-1000">
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: 180 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(0deg)" }}>
          <CardBack />
        </div>
        <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
          <CardFront name={card.name} keywords={card.keywords} arcana={card.arcana} suit={card.suit} number={card.number} orientation={orientation} index={0} />
        </div>
      </motion.div>
    </div>
  );
}

function ReadingDetails({
  card,
  orientation,
  readingType,
  index,
}: {
  card: CardInReading;
  orientation: Orientation;
  readingType: ReadingType;
  index: number;
}) {
  const data = getCardById(card.cardId);
  if (!data) return null;
  const interpretation = getCardInterpretation(data, orientation, readingType);

  return (
    <motion.div
      className="glass p-4 sm:p-5 rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 + 0.5, duration: 0.5 }}
    >
      <h3 className="font-serif-display text-lg text-gold-300 mb-2">
        {data.name} {orientation === "reversed" ? "(Reversed)" : ""}
      </h3>
      <p className="text-warmwhite text-sm leading-relaxed mb-4">{interpretation}</p>
      <div className="mb-4">
        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Keywords</h4>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((k) => (
            <span key={k} className="px-2 py-1 rounded text-xs bg-gold-400/10 text-gold-300">
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Symbolism</h4>
        <p className="text-coolgray text-sm">{data.symbolism}</p>
      </div>
      <div>
        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Guidance</h4>
        <p className="text-moonlight text-sm italic">{data.advice}</p>
      </div>
    </motion.div>
  );
}

function TableCard({
  card,
  orientation,
  position,
  state,
  phase,
  isClickable,
  index,
  onSelect,
  reducedMotion,
}: {
  card: typeof tarotCards[0];
  orientation: Orientation;
  position: CardPosition;
  state: "idle" | "selected" | "dimmed" | "revealed";
  phase: string;
  isClickable: boolean;
  index: number;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const isRevealed = phase === "flipping" || phase === "revealed" || phase === "result";

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion || !isClickable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rotateX: y * -20, rotateY: x * 20 });
  };

  const handleMouseLeave = () => setTilt({ rotateX: 0, rotateY: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (reducedMotion || !isClickable) return;
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (t.clientX - rect.left) / rect.width - 0.5;
    const y = (t.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rotateX: y * -15, rotateY: x * 15 });
  };
  const handleTouchEnd = () => setTilt({ rotateX: 0, rotateY: 0 });

  return (
    <motion.div
      className="absolute select-none"
      style={{
        zIndex: state === "selected" || state === "revealed" ? 100 : index,
        opacity: state === "dimmed" ? 0.2 : 1,
        filter: state === "dimmed" ? "blur(2px) brightness(0.6)" : "none",
        cursor: isClickable ? "pointer" : "default",
        pointerEvents: isClickable ? "auto" : "none",
        willChange: "transform",
      }}
      animate={{
        x: position.x,
        y: position.y,
        rotate: position.rotate,
        scale: position.scale,
        opacity: state === "dimmed" ? 0.2 : 1,
        filter: state === "dimmed" ? "blur(2px) brightness(0.6)" : "none",
      }}
      transition={state === "selected" ? { type: "spring", stiffness: 80, damping: 20 } : { duration: 0.6, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={isClickable ? onSelect : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && isClickable) {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={`${card.name}, ${orientation}`}
      whileHover={isClickable && !reducedMotion ? { scale: 1.03, zIndex: 200 } : {}}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      initial={false}
    >
      <motion.div
        className="relative"
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          transition: reducedMotion ? "none" : "rotateX 0.15s ease-out, rotateY 0.15s ease-out",
        }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: reducedMotion ? 0.3 : 0.8, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(0deg)" }}>
          <CardBack />
        </div>
        <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
          <CardFront
            name={card.name}
            keywords={card.keywords}
            arcana={card.arcana}
            suit={card.suit}
            number={card.number}
            orientation={orientation}
            index={0}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TarotParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const count = reducedMotion ? 8 : 25;
    const particles: Array<{ x: number; y: number; size: number; opacity: number; speedX: number; speedY: number; twinkle: number }> = [];

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.1,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    };

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.twinkle += 0.02;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,184,90,${alpha})`;
        ctx.fill();
      }
      if (running) requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener("resize", init);
    return () => {
      running = false;
      window.removeEventListener("resize", init);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" style={{ width: "100%", height: "100%" }} aria-hidden="true" />;
}

function TarotCursorLight() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const handleMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reducedMotion]);

  return (
    <div className="fixed pointer-events-none z-30 opacity-20" style={{ left: pos.x - 80, top: pos.y - 80, width: 160, height: 160 }}>
      <div className="w-full h-full rounded-full bg-gold-400" style={{ background: "radial-gradient(circle, rgba(212,184,90,0.15) 0%, transparent 70%)" }} />
    </div>
  );
}
