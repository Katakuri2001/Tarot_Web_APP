"use client";

import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";
import { useSoundEnabled } from "@/hooks/useShared";

export default function ReadingsPage() {
  const [soundEnabled] = useSoundEnabled();

  return (
    <>
      <StarBackground />

      {/* A <div>, not a <main>: app/readings/layout.tsx already owns that
          landmark for every route under /readings, so a second one here would
          nest inside it (invalid HTML). The layout also supplies the nav this
          page no longer renders. */}
      <div className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-4">Choose Your Path</p>
            <h1 className="font-serif-display text-4xl md:text-5xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              Select Your Reading
            </h1>
            <p className="text-moonlight max-w-xl mx-auto">
              Each reading type offers a unique lens through which the cards can speak to you.
            </p>
          </motion.div>

          {/* Mini App Drawing Preview */}
          <div className="glass rounded-2xl p-6 sm:p-8 mb-8 max-w-2xl mx-auto">
            <h2 className="font-serif-display text-xl text-warmwhite text-center mb-4" style={{ fontWeight: 400 }}>
              Quick Draw
            </h2>
            <p className="text-moonlight text-sm text-center mb-6">
              Start a reading instantly from this page. Tap a card type below.
            </p>
            <MiniAppDrawing />
          </div>

          {/* Reading type cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { href: "/readings/daily", title: "Daily Reading", desc: "One card for today's energy", icon: "☀" },
              { href: "/readings/love", title: "Love Reading", desc: "Three cards of the heart", icon: "♥" },
              { href: "/readings/career", title: "Career Reading", desc: "Path through professional storms", icon: "⚡" },
              { href: "/readings/general", title: "General Reading", desc: "Three perspectives on your life", icon: "✦" },
            ].map((type, i) => (
              <motion.a
                key={type.href}
                href={type.href}
                className="group block p-6 rounded-xl border border-gold-400/10 bg-midnight/50 hover:border-gold-400/30 transition-all duration-500"
                whileHover={!false ? { y: -6 } : {}}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{type.icon}</span>
                  <div>
                    <h3 className="font-serif-display text-xl text-warmwhite mb-2" style={{ fontWeight: 500 }}>{type.title}</h3>
                    <p className="text-coolgray text-sm leading-relaxed">{type.desc}</p>
                    <span className="text-xs tracking-wider uppercase text-gold-300/60 mt-2 block">
                      {type.href === "/readings/daily" ? "1-card" : "3-card"} reading
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
