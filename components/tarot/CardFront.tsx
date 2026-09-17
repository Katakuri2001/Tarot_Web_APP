import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useShared";
import Logo from "@/components/brand/Logo";
import type { Orientation } from "@/data/types";

interface CardFrontProps {
  name: string;
  keywords: string[];
  arcana: string;
  suit: string;
  number: number;
  orientation: Orientation;
  index?: number;
}

export default function CardFront({ name, keywords, arcana, suit, number, orientation, index = 0 }: CardFrontProps) {
  const reducedMotion = useReducedMotion();
  const isReversed = orientation === "reversed";

  const suitColors: Record<string, string> = {
    wands: "#d4763a",
    cups: "#5b9bd5",
    swords: "#8a8595",
    pentacles: "#bfa055",
  };

  const suitSymbol: Record<string, string> = {
    wands: "♆",
    cups: "♀",
    swords: "⚷",
    pentacles: "◈",
  };

  return (
    <div className="relative w-full h-full flex flex-col" style={{ transform: isReversed ? "scaleX(-1)" : undefined }}>
      <div className="flex-1 rounded-lg overflow-hidden relative" style={{
        background: "linear-gradient(135deg, #1a0a3e 0%, #2d1b69 50%, #06060f 100%)",
        border: "1px solid rgba(212,184,90,0.3)",
      }}>
        {/* Top decoration */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className="text-gold-300 text-xs font-serif-display" style={{ opacity: 0.7 }}>
            {arcana === "major" ? `${String(number).padStart(2, "0")}` : suit?.charAt(0).toUpperCase() + suit?.slice(1)}
          </span>
          <span className="text-gold-300 text-sm" style={{ opacity: 0.6 }}>
            {suitSymbol[suit] || "✦"}
          </span>
        </div>

        {/* Center area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <motion.div
            className="w-16 h-16 rounded-full mb-3 flex items-center justify-center"
            style={{ background: "radial-gradient(circle, rgba(212,184,90,0.2) 0%, transparent 70%)" }}
            animate={!reducedMotion ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-gold-300 text-2xl font-serif-display" style={{ opacity: 0.8 }}>
              {suitSymbol[suit] || "✦"}
            </span>
          </motion.div>

          <h3 className="font-serif-display text-lg text-warmwhite text-center" style={{ fontWeight: 400 }}>
            {name}
          </h3>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <span className="text-coolgray text-xs">{keywords.slice(0, 2).join(" • ")}</span>
          <span className="text-gold-300 text-xs" style={{ opacity: 0.5 }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>

        {/* Decorative border */}
        <div className="absolute inset-1 rounded-md pointer-events-none" style={{ border: "1px solid rgba(212,184,90,0.1)" }} />
      </div>
    </div>
  );
}
