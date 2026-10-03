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
  size?: "sm" | "md" | "lg" | "fluid";
  position?: CardPosition;
  style?: React.CSSProperties;
  className?: string;
  /**
   * "flow" (default) keeps the card in normal document flow, so `position`
   * acts as an offset from wherever flex/grid placed it. Use "absolute" to
   * pin the card to its parent's top-left and treat `position.x/y` as true
   * container coordinates — required for the free-form spread, where cards
   * are positioned by an explicit arc rather than by layout.
   */
  layout?: "flow" | "absolute";
}

const sizeClasses = {
  sm: "w-28 h-40",
  md: "w-36 h-52",
  lg: "w-44 h-64",
  /**
   * Fill the parent instead of using a fixed size. Used where a row of cards
   * has to fit an unknown number of cards into a known width (the result
   * screen), so fixed pixel sizes cannot overlap.
   */
  fluid: "w-full h-full",
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
  layout = "flow",
}: MiniAppCardProps) {
  const reducedMotion = useReducedMotion();

  const pos = position || { x: 0, y: 0, rotate: 0, scale: 1 };
  const handleClick = onSelect || onClick;

  const positionClass = layout === "absolute" ? "absolute top-0 left-0" : "relative";

  return (
    <motion.div
      className={`${sizeClasses[size]} ${positionClass} cursor-pointer select-none ${className}`}
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
      /* Never announce a face-down card's identity: the name is the answer the
         whole reading builds toward, and the label was previously exposed even
         while the back of the card was showing. Only swap in the real name once
         the card has actually flipped. */
      aria-label={
        isRevealed
          ? `${card.name}, ${orientation}`
          : `Face-down tarot card ${index + 1}${isSelected ? ", selected" : ""}`
      }
      aria-pressed={isSelected}
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

        {/* Card Front. aria-hidden while face-down: backface-visibility only
            hides these pixels, it does not remove them from the accessibility
            tree, so the name/keywords below would otherwise be read out from a
            card the visitor has not yet seen. */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
          aria-hidden={!isRevealed}
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
