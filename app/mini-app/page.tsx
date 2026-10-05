"use client";

import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";

/**
 * Standalone Mini App entry point. No `initialCategory` is passed, so the
 * experience opens on the category picker.
 */
export default function MiniAppPage() {
  return <MiniAppDrawing />;
}
