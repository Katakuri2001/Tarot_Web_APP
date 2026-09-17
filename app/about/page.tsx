"use client";

import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";

export default function AboutPage() {
  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-2">About</p>
            <h1 className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              The Velora Way
            </h1>
          </motion.div>

          <div className="space-y-12">
            <section className="glass p-8 rounded-2xl">
              <h2 className="font-serif-display text-xl text-warmwhite mb-4">Our Philosophy</h2>
              <p className="text-moonlight leading-relaxed">
                Velora is built on the belief that tarot is a mirror — reflecting not
                what will happen, but what is possible. Every card is an invitation
                to look deeper, to ask better questions, and to trust the wisdom
                that already lives within you.
              </p>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="font-serif-display text-xl text-warmwhite mb-4">The Deck</h2>
              <p className="text-moonlight leading-relaxed">
                Our readings draw from the complete 78-card tarot tradition — 22
                cards of the Major Arcana and 56 of the Minor. Each carries its own
                symbolism, its own voice, and its own guidance. Nothing is left to
                chance or empty templates; every interpretation is seeded with
                meaning.
              </p>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="font-serif-display text-xl text-warmwhite mb-4">How It Works</h2>
              <div className="space-y-4">
                {[
                  "Choose a reading type that speaks to where you are.",
                  "Set your intention. Pose your question if you wish.",
                  "Shuffle the deck and let your intuition guide your choice.",
                  "Receive the card&apos;s meaning — upright or reversed — along with its guidance.",
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-400/10 text-gold-300 flex items-center justify-center text-sm font-serif-display">
                      {i + 1}
                    </span>
                    <p className="text-moonlight pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="font-serif-display text-xl text-warmwhite mb-4">A Note on Intention</h2>
              <p className="text-moonlight leading-relaxed">
                Tarot is not fortune-telling. It is reflection. The cards open a
                door — what you find on the other side is your own truth, your own
                knowing. Trust it.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
