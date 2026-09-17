"use client";

import { Suspense } from "react";
import Navigation from "@/components/Navigation";

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-moonlight pt-24">Loading...</div>}>
        {children}
      </Suspense>
    </>
  );
}
