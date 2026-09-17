"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IntroAnimation from "@/components/brand/IntroAnimation";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import { hasIntroPlayed } from "@/services/readingService";

export default function HomePage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (hasIntroPlayed()) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <>
      <StarBackground />
      <Navigation />

      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="order-2 md:order-1">
              <motion.h1
                className="font-serif-display text-5xl md:text-7xl leading-tight mb-6"
                style={{ fontWeight: 300 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="text-warmwhite block">Discover What</span>
                <span className="text-warmwhite block">The Cards</span>
                <span className="text-gold-300 block">Reveal</span>
              </motion.h1>

              <motion.p
                className="text-moonlight text-lg leading-relaxed mb-8 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Focus on your question. Trust your intuition. Let the tarot cards
                reveal another perspective on your journey.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <a
                  href="/readings"
                  className="px-8 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors duration-300"
                >
                  Begin Your Reading
                </a>
                <a
                  href="/explorer"
                  className="px-8 py-3 rounded-full border border-gold-400/30 text-gold-300 font-medium tracking-wider text-sm hover:border-gold-400/60 hover:bg-gold-400/5 transition-all duration-300"
                >
                  Explore The Tarot
                </a>
              </motion.div>
            </div>

            {/* Visual */}
            <div className="order-1 md:order-2 flex justify-center">
              <motion.div
                className="relative"
                animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Floating tarot card */}
                <div
                  className="w-48 h-72 md:w-56 md:h-80 rounded-2xl overflow-hidden relative"
                  style={{
                    boxShadow: "0 0 60px rgba(212,184,90,0.15), 0 0 120px rgba(26,10,62,0.3)",
                  }}
                >
                  <img
                    src="/cards/back.jpg"
                    alt="Tarot card"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* Fallback card back visual */}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a0a3e, #06060f)" }}>
                    <svg width="80" height="80" viewBox="0 0 40 40" fill="none">
                      <path d="M24 8C18.5 10 14 16 14 22C14 28 18.5 34 24 36C20 32 19 27 21 22C23 17 27 13 24 8Z" fill="#d4b85a" opacity="0.8" />
                      <circle cx="22" cy="20" r="2" fill="#f0ebe6" opacity="0.9" />
                    </svg>
                  </div>
                </div>

                {/* Crescent moon */}
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, #d4b85a 0%, transparent 70%)" }}
                />

                {/* Small stars */}
                <div className="absolute top-4 -left-12 w-2 h-2 bg-warmwhite rounded-full opacity-60 animate-pulse" />
                <div className="absolute bottom-12 -right-16 w-1.5 h-1.5 bg-gold-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute -bottom-4 left-8 w-1 h-1 bg-moonlight rounded-full opacity-50 animate-pulse" style={{ animationDelay: "2s" }} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.p
              className="text-gold-300 tracking-widest uppercase text-xs mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Journey Awaits
            </motion.p>
            <motion.h2
              className="font-serif-display text-3xl md:text-4xl text-warmwhite mb-8"
              style={{ fontWeight: 300 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Choose Your Path
            </motion.h2>
            <motion.p
              className="text-moonlight mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Whether you seek guidance for today, love, career, or life in
              general — the cards hold your answer.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { href: "/readings/daily", title: "Daily Reading", desc: "One card for today's energy", icon: "☀" },
                { href: "/readings/love", title: "Love Reading", desc: "Three cards of the heart", icon: "♥" },
                { href: "/readings/career", title: "Career Reading", desc: "Path through professional storms", icon: "⚡" },
                { href: "/readings/general", title: "General Reading", desc: "Three perspectives on your life", icon: "✦" },
              ].map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className="glass p-6 rounded-xl text-left hover:border-gold-400/30 transition-all duration-500 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={!true ? {} : { y: -4 }}
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h3 className="font-serif-display text-lg text-warmwhite mb-1">{item.title}</h3>
                  <p className="text-coolgray text-sm">{item.desc}</p>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-gold-400/5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-serif-display text-warmwhite text-sm tracking-wider">Velora</span>
            <p className="text-coolgray text-xs">Read Beyond The Visible.</p>
            <span className="text-coolgray text-xs">© 2026 Velora Tarot</span>
          </div>
        </footer>
      </main>
    </>
  );
}

