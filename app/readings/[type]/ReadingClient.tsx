"use client";

import { Suspense } from "react";
import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";
import type { ReadingType } from "@/data/types";

/** Client wrapper so the drawing experience can use hooks and effects. */
export default function ReadingClient({ type }: { type: ReadingType }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-moonlight">
          Loading your reading...
        </div>
      }
    >
      <MiniAppDrawing initialType={type} />
    </Suspense>
  );
}
