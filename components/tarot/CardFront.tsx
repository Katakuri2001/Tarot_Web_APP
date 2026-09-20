import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useShared";
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

  const color = suitColors[suit] || "#d4b85a";
  const symbol = suitSymbol[suit] || "✦";

  return (
    <div className="relative w-full h-full flex flex-col" style={{ transform: isReversed ? "scaleX(-1)" : undefined }}>
      <div
        className="flex-1 rounded-lg overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #1a0a3e 0%, #2d1b69 50%, #06060f 100%)",
          border: `1px solid ${color}33`,
        }}
      >
        {/* Top decoration */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className="font-serif-display text-xs" style={{ opacity: 0.6, color }}>
            {arcana === "major" ? `${String(number).padStart(2, "0")}` : suit?.charAt(0).toUpperCase() + suit?.slice(1)}
          </span>
          <span className="text-lg" style={{ opacity: 0.5, color }}>
            {symbol}
          </span>
        </div>

        {/* Center illustration area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {/* Glow ring */}
          <motion.div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-2 flex items-center justify-center relative"
            style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
            animate={!reducedMotion ? { opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="text-3xl" style={{ opacity: 0.7, color }}>
              {symbol}
            </span>
          </motion.div>

          {/* Card name */}
          <h3 className="font-serif-display text-base text-center leading-tight" style={{ color: "rgba(240,235,230,0.9)", fontWeight: 400 }}>
            {name}
          </h3>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <span className="text-xs" style={{ opacity: 0.5, color: "rgba(138,133,149,0.7)" }}>
            {keywords.slice(0, 2).join(" • ")}
          </span>
          <span className="font-serif-display text-xs" style={{ opacity: 0.4, color }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>

        {/* Decorative border */}
        <div className="absolute inset-1 rounded-md pointer-events-none" style={{ border: `1px solid ${color}15` }} />
      </div>
    </div>
  );
}