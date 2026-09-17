"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import { tarotCards } from "@/data/tarotCards";
import { getReadingTypePositions, getReadingTypeLabel } from "@/utils/tarotUtils";
import { shuffleArray, generateReadingId } from "@/utils/tarotUtils";
import { saveReadingToStorage } from "@/services/readingService";
import { useSound } from "@/services/soundService";
import { useReducedMotion } from "@/hooks/useShared";
import type { ReadingType, Orientation, CardInReading } from "@/data/types";

const READING_TYPE_COLORS: Record<ReadingType, string> = {
  daily: "#d4b85a",
  love: "#e06c9f",
  career: "#5b9bd5",
  general: "#a78bfa",
};

function ReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "daily") as ReadingType;
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<"setup" | "shuffling" | "selecting" | "revealing">("setup");
  const [question, setQuestion] = useState("");
  const [deck, setDeck] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardInReading[]>([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const numCards = type === "daily" ? 1 : 3;
  const positions = getReadingTypePositions(type);
  const { shuffle, flip, reveal } = useSound(false);

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      const shuffled = shuffleArray(tarotCards.map((c) => c.id));
      setDeck(shuffled);
    }
  }, [hasStarted]);

  const handleShuffle = () => {
    setStep("shuffling");
    shuffle();
    let count = 0;
    const interval = setInterval(() => {
      setShuffleCount((prev) => prev + 1);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setTimeout(() => {
          setDeck(shuffleArray(tarotCards.map((c) => c.id)));
          setStep("selecting");
        }, 500);
      }
    }, 300);
  };

  const handleSelectCard = (cardId: string) => {
    const orientation: Orientation = Math.random() > 0.5 ? "reversed" : "upright";
    const newSelection: CardInReading = {
      position: positions[selectedCards.length]?.position || "past",
      cardId,
      orientation,
    };

    const updated = [...selectedCards, newSelection];
    setSelectedCards(updated);
    flip();

    if (updated.length >= numCards) {
      setStep("revealing");
      setTimeout(() => {
        const readingId = generateReadingId();
        const savedCards = updated.map((c) => {
          const cardData = tarotCards.find((tc) => tc.id === c.cardId);
          return {
            position: c.position,
            cardName: cardData?.name || c.cardId,
            cardId: c.cardId,
            orientation: c.orientation,
          };
        });
        saveReadingToStorage({
          id: readingId,
          readingType: type,
          category: getReadingTypeLabel(type),
          question,
          cards: savedCards,
          timestamp: Date.now(),
        });
        reveal();
        router.push(`/readings/${type}/${readingId}`);
      }, 1500);
    }
  };

  const availableCards = deck.filter((id) => !selectedCards.some((c) => c.cardId === id)).slice(0, 12);
  const color = READING_TYPE_COLORS[type];

  if (step === "revealing") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-6 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(212,184,90,0.2) 0%, transparent 70%)" }}
            animate={!reducedMotion ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="text-gold-300 text-sm tracking-widest uppercase mb-2">Please choose a card</p>
          <p className="text-moonlight">Cards are being revealed...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">
              {getReadingTypeLabel(type)}
            </p>
            <h1 className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              {type === "daily" ? "What energy surrounds you today?" : "Focus on your question"}
            </h1>
          </motion.div>

          {/* Setup step */}
          {step === "setup" && (
            <motion.div
              className="max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-moonlight text-sm mb-3 tracking-wider">Your question (optional)</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask the cards?"
                className="w-full h-24 bg-midnight/50 border border-gold-400/10 rounded-xl p-4 text-warmwhite placeholder:text-muted text-sm focus:outline-none focus:border-gold-400/30 transition-colors resize-none"
                aria-label="Your question"
              />
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleShuffle}
                  className="px-10 py-3 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: color, color: "#06060f" }}
                >
                  Begin
                </button>
              </div>
            </motion.div>
          )}

          {/* Shuffling step */}
          {step === "shuffling" && (
            <motion.div
              className="flex flex-col items-center justify-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative mb-8">
                <div
                  className="w-48 h-48 rounded-full border border-gold-400/20"
                  style={{ animation: !reducedMotion ? "spinSlow 8s linear infinite" : undefined }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-32 h-32 rounded-full border border-gold-400/10"
                      style={{ animation: !reducedMotion ? "spinSlow 6s linear infinite reverse" : undefined }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-16 h-16 rounded-full"
                          style={{ background: "radial-gradient(circle, rgba(212,184,90,0.3) 0%, transparent 70%)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gold-300 tracking-widest uppercase text-sm mb-2">Shuffling the deck</p>
              <p className="text-moonlight text-sm">Focus on your question...</p>
            </motion.div>
          )}

          {/* Selecting step */}
          {step === "selecting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center mb-8">
                <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">Trust Your Intuition</p>
                <p className="text-moonlight text-sm">Choose the card that draws your attention</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
                {availableCards.map((cardId, i) => {
                  const card = tarotCards.find((c) => c.id === cardId);
                  if (!card) return null;
                  return (
                    <motion.button
                      key={cardId}
                      className="relative aspect-[2/3] rounded-lg overflow-hidden border border-gold-400/10 hover:border-gold-400/40 transition-all duration-300"
                      style={{ background: "linear-gradient(135deg, #1a0a3e, #06060f)" }}
                      onClick={() => handleSelectCard(cardId)}
                      whileHover={!reducedMotion ? { scale: 1.05, y: -5 } : {}}
                      whileTap={!reducedMotion ? { scale: 0.95 } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      aria-label={`Select ${card.name}`}
                    >
                      {/* Mini card back */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                          <path d="M24 8C18.5 10 14 16 14 22C14 28 18.5 34 24 36C20 32 19 27 21 22C23 17 27 13 24 8Z" fill="#d4b85a" opacity="0.5" />
                          <circle cx="22" cy="20" r="2" fill="#f0ebe6" opacity="0.7" />
                        </svg>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="text-center mt-6 text-coolgray text-xs">
                {selectedCards.length} of {numCards} selected
              </div>
            </motion.div>
          )}

          {/* Back button */}
          {["revealing", "shuffling"].includes(step as any) === false && (
            <div className="text-center mt-8">
              <button
                onClick={() => router.back()}
                className="text-coolgray hover:text-warmwhite transition-colors text-sm tracking-wider"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-moonlight">Loading...</div>}>
      <ReadingPageContent />
    </Suspense>
  );
}
