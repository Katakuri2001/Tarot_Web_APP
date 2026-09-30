"use client";

import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";

/**
 * Standalone Mini App entry point. No `initialType` is passed, so the
 * experience opens on the reading-type picker.
 */
export default function MiniAppPage() {
  return <MiniAppDrawing />;
}
