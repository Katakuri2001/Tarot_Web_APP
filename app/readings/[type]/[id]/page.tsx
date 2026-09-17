"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import TarotCard from "@/components/tarot/TarotCard";
import { tarotCards } from "@/data/tarotCards";
import { getCardById, getCardInterpretation, getPositionMeaning, getReadingTypeLabel } from "@/utils/tarotUtils";
import { getReadingsFromStorage } from "@/services/readingService";
import { useSound } from "@/services/soundService";
import { useReducedMotion } from "@/hooks/useShared";
import { getTomorrowDate, formatDate } from "@/utils/dateUtils";
import type { Orientation } from "@/data/types";
import type { SavedReading } from "@/data/types";

export default function ReadingResultPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const id = params.id as string;
  const reducedMotion = useReducedMotion();
  const { reveal } = useSound(false);
  const [cards, setCards] = useState<SavedReading | null>(null);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const readings = getReadingsFromStorage();
    const found = readings.find((r) => r.id === id);
    if (found) {
      setCards(found);
    } else {
      // Create from tarot data if available
      const allReadings = getReadingsFromStorage();
      const matching = allReadings.find((r) => r.id === id);
      if (matching) {
        setCards(matching);
      }
    }
  }, [id]);

  useEffect(() => {
    if (cards && revealedIndex < cards.cards.length - 1) {
      const timer = setTimeout(() => {
        setRevealedIndex((prev) => prev + 1);
        reveal();
      }, 1200);
      return () => clearTimeout(timer);
    } else if (cards && revealedIndex === cards.cards.length - 1) {
      const timer = setTimeout(() => setShowSummary(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [cards, revealedIndex, reveal]);

  if (!cards) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="text-center">
          <p className="text-moonlight mb-4">Loading your reading...</p>
          <button onClick={() => router.push("/readings")} className="text-gold-300 text-sm tracking-wider">
            Return to Readings
          </button>
        </div>
      </div>
    );
  }

  const dateStr = formatDate(new Date(cards.timestamp));

  const handleShare = async () => {
    const cardNames = cards.cards.map((c) => c.cardName).join(" • ");
    const text = `I drew ${cardNames} during a ${cards.category}. Find your own reading at Velora.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Velora Reading", text });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("Reading copied to clipboard!");
      } catch {
        // clipboard unavailable
      }
    }
  };

  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">{getReadingTypeLabel(cards.readingType)}</p>
            <p className="text-coolgray text-sm">{dateStr}</p>
          </motion.div>

          {/* Cards */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-16">
            {cards.cards.map((card, i) => {
              const cardData = getCardById(card.cardId);
              if (!cardData) return null;
              const isRevealed = i <= revealedIndex;

              return (
                <motion.div
                  key={i}
                  className="w-44 md:w-52"
                  initial={{ opacity: 0, y: 40 }}
                  animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={reducedMotion ? { duration: 0.3 } : { duration: 0.6, delay: i * 0.2 }}
                >
                  {/* Position label */}
                  {cards.cards.length > 1 && (
                    <p className="text-center text-gold-300 tracking-widest uppercase text-xs mb-3">
                      {getPositionMeaning(card.position)}
                    </p>
                  )}

                  <TarotCard
                    card={cardData}
                    orientation={card.orientation as Orientation}
                    isRevealed={isRevealed}
                    aria-label={`${cardData.name}, ${card.orientation}`}
                  />

                  {isRevealed && (
                    <motion.div
                      className="text-center mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="font-serif-display text-warmwhite text-lg" style={{ fontWeight: 500 }}>
                        {cardData.name}
                      </p>
                      <p className="text-coolgray text-xs mt-1">
                        {card.orientation === "reversed" ? "Reversed" : "Upright"}
                      </p>
                      <div className="flex justify-center gap-1 mt-1 flex-wrap">
                        {cardData.keywords.slice(0, 3).map((k) => (
                          <span key={k} className="text-gold-300 text-[10px] tracking-wider">
                            {k}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {showSummary && (
            <motion.div
              className="max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif-display text-2xl text-warmwhite text-center mb-8" style={{ fontWeight: 400 }}>
                Your Reading
              </h2>
              <div className="grid gap-6">
                {cards.cards.map((card, i) => {
                  const cardData = getCardById(card.cardId);
                  if (!cardData) return null;
                  const interpretation = getCardInterpretation(cardData, card.orientation as Orientation, cards.readingType);

                  return (
                    <div key={i} className="glass p-6 rounded-xl">
                      <h3 className="font-serif-display text-lg text-gold-300 mb-2">
                        {cardData.name} {card.orientation === "reversed" ? "(Reversed)" : ""}
                      </h3>
                      <p className="text-warmwhite text-sm leading-relaxed mb-4">{interpretation}</p>

                      <div className="mb-4">
                        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {cardData.keywords.map((k) => (
                            <span key={k} className="px-2 py-1 rounded text-xs bg-gold-400/10 text-gold-300">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Symbolism</h4>
                        <p className="text-coolgray text-sm">{cardData.symbolism}</p>
                      </div>

                      <div>
                        <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-2">Guidance</h4>
                        <p className="text-moonlight text-sm italic">{cardData.advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reading Summary */}
              <div className="mt-8 glass p-6 rounded-xl">
                <h3 className="font-serif-display text-lg text-gold-300 mb-3">Reading Summary</h3>
                <p className="text-moonlight text-sm leading-relaxed">
                  Your {cards.category.toLowerCase()} reading reveals {cards.cards.length}
                  {cards.cards.length === 1 ? "" : ""} card{cards.cards.length > 1 ? "s" : ""} of insight.{" "}
                  {cards.cards.map((c) => {
                    const cd = getCardById(c.cardId);
                    return cd ? cd.name : "";
                  }).join(", ")}.
                  {" "}Each card speaks to a unique facet of your journey, offering guidance where it is most needed.
                </p>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          {showSummary && (
            <motion.div
              className="flex justify-center gap-4 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => router.push("/readings")}
                className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 transition-all"
              >
                New Reading
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 transition-all"
              >
                Share Reading
              </button>
              <button
                onClick={() => router.push("/readings/history")}
                className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 transition-all"
              >
                My Readings
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
