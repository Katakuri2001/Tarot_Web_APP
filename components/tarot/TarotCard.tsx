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
      /* Both faces below are `absolute inset-0`, so nothing inside this card
         contributes height — the root has to supply it or the card collapses
         to zero and its face stretches to a 2px sliver. 2/3 matches CardBack's
         viewBox ("0 0 200 300"), which is the proportion the art is drawn at.
         It lives in the base class rather than at the call site so a caller
         that passes no size still gets a card that renders; passing a className
         with its own sizing overrides this. */
      className={`perspective-1000 cursor-pointer aspect-[2/3] ${className}`}
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
      /* Neutral until flipped — see the same note in MiniAppCard. A caller
         may still force a label, so ?? (not ||) keeps an explicit "" honest. */
      aria-label={
        ariaLabel ??
        (isRevealed
          ? `Tarot card: ${card.name}, ${orientation}`
          : `Face-down tarot card${isSelected ? ", selected" : ""}`)
      }
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

        {/* Card Front. aria-hidden while face-down — see MiniAppCard. */}
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
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
