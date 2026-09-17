import { Suspense } from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-moonlight animate-pulse">Loading...</div>
    </div>
  );
}
