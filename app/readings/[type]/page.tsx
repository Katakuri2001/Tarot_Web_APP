"use client";

import { Suspense } from "react";
import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";
import type { ReadingType } from "@/data/types";

interface Props {
  params: { type?: string };
  searchParams: { type?: string };
}

export default function MiniAppReadingPage({ params, searchParams }: Props) {
  const type = (searchParams.type || params.type || "daily") as ReadingType;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-moonlight">Loading your reading...</div>}>
      <MiniAppDrawing initialType={type} />
    </Suspense>
  );
}
