"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import { tarotCards } from "@/data/tarotCards";
import type { Arcana } from "@/data/types";
import type { TarotCardData } from "@/data/types";
import { searchCards, getCardsByArcana } from "@/utils/tarotUtils";
import { getCardById } from "@/utils/tarotUtils";

const filters: { value: Arcana | "all"; label: string }[] = [
  { value: "all", label: "All Cards" },
  { value: "major", label: "Major Arcana" },
  { value: "wands", label: "Wands" },
  { value: "cups", label: "Cups" },
  { value: "swords", label: "Swords" },
  { value: "pentacles", label: "Pentacles" },
];

export default function ExplorerPage() {
  const [activeFilter, setActiveFilter] = useState<Arcana | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);

  const filtered = () => {
    if (searchQuery) return searchCards(searchQuery);
    if (activeFilter === "all") return tarotCards;
    return getCardsByArcana(activeFilter);
  };

  const displayCards = filtered();

  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">The Full Deck</p>
            <h1 className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              Explore The Tarot
            </h1>
            <p className="text-moonlight">{displayCards.length} cards</p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setActiveFilter(f.value); setSearchQuery(""); }}
                className={`px-3 py-2 rounded-full text-xs tracking-wider transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  activeFilter === f.value
                    ? "bg-gold-400/20 text-gold-300 border border-gold-400/30"
                    : "text-coolgray border border-transparent hover:text-moonlight"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex justify-center mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveFilter("all"); }}
              placeholder="Search cards by name or keyword..."
              className="w-full max-w-sm bg-midnight/50 border border-gold-400/10 rounded-full px-5 py-2.5 text-sm text-warmwhite placeholder:text-muted focus:outline-none focus:border-gold-400/30 transition-colors"
              aria-label="Search tarot cards"
            />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
            <AnimatePresence mode="popLayout">
              {displayCards.map((card, i) => (
                <motion.button
                  key={card.id}
                  className="relative aspect-[2/3] rounded-lg overflow-hidden border border-gold-400/10 hover:border-gold-400/30 transition-all duration-300 group text-left"
                  style={{ background: "linear-gradient(135deg, #1a0a3e, #06060f)" }}
                  onClick={() => setSelectedCard(card)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.3) }}
                  whileHover={!true ? {} : { y: -4, borderColor: "rgba(212,184,90,0.3)" }}
                  aria-label={`View ${card.name}`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className="text-gold-300/60 text-[10px] tracking-widest mb-1">
                      {String(card.number).padStart(2, "0")}
                    </span>
                    <span className="text-warmwhite text-[11px] font-serif-display text-center leading-tight mb-1">
                      {card.name}
                    </span>
                    <span className="text-coolgray text-[8px]">
                      {card.arcana === "major" ? "Major" : card.arcana}
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Card detail modal */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
            >
              <div className="absolute inset-0 bg-deepnight/80 backdrop-blur-sm" />
              <motion.div
                className="relative bg-midnight border border-gold-400/20 rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 text-coolgray hover:text-warmwhite transition-colors"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="font-serif-display text-2xl text-warmwhite mb-1" style={{ fontWeight: 500 }}>
                  {selectedCard.name}
                </h2>
                <p className="text-gold-300 text-xs tracking-widest uppercase mb-4">
                  {selectedCard.arcana === "major" ? "Major Arcana" : selectedCard.arcana}
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.keywords.map((k) => (
                        <span key={k} className="px-2 py-1 rounded text-xs bg-gold-400/10 text-gold-300">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Symbolism</h4>
                    <p className="text-coolgray text-sm">{selectedCard.symbolism}</p>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Upright</h4>
                    <p className="text-warmwhite text-sm">{selectedCard.uprightMeaning}</p>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Reversed</h4>
                    <p className="text-warmwhite text-sm">{selectedCard.reversedMeaning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Love</h4>
                      <p className="text-moonlight text-xs">
                        {selectedCard.loveUpright}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Career</h4>
                      <p className="text-moonlight text-xs">
                        {selectedCard.careerUpright}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gold-300/60 mb-1">Advice</h4>
                    <p className="text-gold-300 text-sm italic">{selectedCard.advice}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
