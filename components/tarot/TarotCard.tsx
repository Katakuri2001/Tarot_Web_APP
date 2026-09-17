"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useShared";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import type { Orientation } from "@/data/types";
import type { TarotCardData } from "@/data/types";

interface TarotCardProps {
  card: TarotCardData;
  orientation: Orientation;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  isSelected?: boolean;
  isRevealed?: boolean;
  style?: React.CSSProperties;
  className?: string;
  tabIndex?: number;
  "aria-label"?: string;
}

export default function TarotCard({
  card,
  orientation,
  onClick,
  onHover,
  onLeave,
  isSelected = false,
  isRevealed = false,
  style,
  className = "",
  tabIndex = 0,
  "aria-label": ariaLabel,
}: TarotCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`perspective-1000 cursor-pointer ${className}`}
      style={{ ...style }}
      onClick={onClick}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      whileHover={!isRevealed && !reducedMotion ? { scale: 1.05, y: -8 } : {}}
      whileTap={!isRevealed ? { scale: 0.97 } : {}}
      transition={reducedMotion ? { duration: 0.3 } : { duration: 0.4, ease: "easeOut" }}
      whileFocus={{ scale: 1.03, y: -5 }}
      tabIndex={tabIndex}
      role="button"
      aria-label={ariaLabel || `Tarot card: ${card.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <motion.div
        className="w-full h-full relative"
        animate={isRevealed ? { rotateY: 180 } : { rotateY: 0 }}
        transition={reducedMotion ? { duration: 0.3 } : { duration: 0.8, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Card Back */}
        <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(0deg)" }}>
          <CardBack />
        </div>

        {/* Card Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <CardFront
            name={card.name}
            keywords={card.keywords}
            arcana={card.arcana}
            suit={card.suit}
            number={card.number}
            orientation={orientation}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
