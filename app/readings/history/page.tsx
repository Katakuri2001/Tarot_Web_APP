"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import { tarotCards } from "@/data/tarotCards";
import { getReadingsFromStorage } from "@/services/readingService";
import { getReadingTypeLabel } from "@/utils/tarotUtils";
import { formatDate } from "@/utils/dateUtils";
import type { SavedReading } from "@/data/types";

export default function MyReadingsPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<SavedReading[]>([]);

  useEffect(() => {
    setReadings(getReadingsFromStorage());
  }, []);

  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">Your Journey</p>
            <h1 className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              My Readings
            </h1>
          </motion.div>

          {readings.length === 0 ? (
            <motion.div
              className="text-center py-24 glass rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-gold-400/20 flex items-center justify-center">
                <span className="text-gold-300 text-2xl font-serif-display">✦</span>
              </div>
              <p className="text-moonlight mb-6">You haven&apos;t completed a reading yet.</p>
              <Link
                href="/readings"
                className="px-8 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors inline-block"
              >
                Begin Your First Reading
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {readings.map((reading, i) => (
                  <motion.div
                    key={reading.id}
                    className="glass p-5 rounded-xl cursor-pointer hover:border-gold-400/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={!true ? {} : { y: -2 }}
                    onClick={() => router.push(`/readings/${reading.readingType}/${reading.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-warmwhite text-sm">{formatDate(new Date(reading.timestamp))}</p>
                        <p className="text-gold-300 text-sm tracking-wider">{reading.category}</p>
                      </div>
                      <div className="flex gap-2">
                        {reading.cards.map((c, ci) => (
                          <span key={ci} className="text-moonlight text-xs bg-midnight/50 px-2 py-1 rounded">
                            {c.cardName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
