"use client";

import { useState } from "react";
import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";

export default function MiniAppPage() {
  const [showDrawing, setShowDrawing] = useState(false);

  return (
    <>
      {showDrawing ? (
        <MiniAppDrawing />
      ) : (
        <div className="min-h-screen bg-deepnight">
          {/* This is a wrapper - the MiniAppDrawing handles the full screen */}
          <MiniAppDrawing />
        </div>
      )}
    </>
  );
}
