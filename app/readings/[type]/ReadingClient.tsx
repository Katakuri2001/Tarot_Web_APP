"use client";

import { Suspense } from "react";
import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";
import type { TarotCategory } from "@/data/types";

/** Client wrapper so the drawing experience can use hooks and effects. */
export default function ReadingClient({ initialCategory }: { initialCategory?: TarotCategory }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-moonlight">
          Loading your reading...
        </div>
      }
    >
      <MiniAppDrawing initialCategory={initialCategory} />
    </Suspense>
  );
}
