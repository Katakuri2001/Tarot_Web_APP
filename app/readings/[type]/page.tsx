"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TarotTable from "@/components/tarot/TarotTable";
import type { ReadingType } from "@/data/types";

export default function ReadingPage() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "daily") as ReadingType;
  const router = useRouter();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-moonlight">Loading your reading...</div>}>
      <TarotTable readingType={type} onNewReading={() => router.push("/readings")} />
    </Suspense>
  );
}
