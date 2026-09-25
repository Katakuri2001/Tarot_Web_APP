"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useShared";
import CardBack from "./CardBack";
import CardFront from "./CardFront";
import type { Orientation } from "@/data/types";
import type { TarotCardData } from "@/data/types";

interface CardPosition {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity?: number;
  filter?: string;
}

interface MiniAppCardProps {
  card: TarotCardData;
  orientation: Orientation;
  onClick?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  isRevealed?: boolean;
  isDimmed?: boolean;
  isClickable?: boolean;
  index?: number;
  size?: "sm" | "md" | "lg";
  position?: CardPosition;
  style?: React.CSSProperties;
  className?: string;
}

const sizeClasses = {
  sm: "w-28 h-40",
  md: "w-36 h-52",
  lg: "w-44 h-64",
};

export default function MiniAppCard({
  card,
  orientation,
  onClick,
  onSelect,
  isSelected = false,
  isRevealed = false,
  isDimmed = false,
  isClickable = false,
  index = 0,
  size = "md",
  position,
  style,
  className = "",
}: MiniAppCardProps) {
  const reducedMotion = useReducedMotion();

  const pos = position || { x: 0, y: 0, rotate: 0, scale: 1 };
  const handleClick = onSelect || onClick;

  return (
    <motion.div
      className={`${sizeClasses[size]} relative cursor-pointer select-none ${className}`}
      style={{
        ...style,
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? "blur(3px) brightness(0.4)" : "none",
        zIndex: isSelected || isRevealed ? 100 : index,
        pointerEvents: isClickable ? "auto" : "none",
        touchAction: "manipulation",
      }}
      onClick={isClickable ? handleClick : undefined}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      animate={{
        x: pos.x,
        y: pos.y,
        rotate: pos.rotate,
        scale: isSelected ? 1.15 : pos.scale,
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? "blur(3px) brightness(0.4)" : "none",
      }}
      transition={
        reducedMotion
          ? { duration: 0.3 }
          : { type: "spring", stiffness: 80, damping: 20 }
      }
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={`${card.name}, ${orientation}`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && isClickable) {
          e.preventDefault();
          handleClick?.();
        }
      }}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: "easeInOut" }}
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
            index={0}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
