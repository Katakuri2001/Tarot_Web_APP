"use client";

import { motion } from "framer-motion";
import PhoneFrame, { PREVIEW_DEVICE } from "@/components/PhoneFrame";

interface PreviewRoute {
  path: string;
  title: string;
  note: string;
  /** Deep-link straight into a state, so previews show content, not a picker. */
  hash?: string;
}

const ROUTES: PreviewRoute[] = [
  { path: "/readings", title: "Readings", note: "Pick your spread" },
  { path: "/explorer", title: "Tarot", note: "Browse all 78 cards" },
  { path: "/readings/love", title: "Love", note: "Three-card draw" },
  { path: "/readings/history", title: "History", note: "Past readings" },
  { path: "/about", title: "About", note: "The observatory" },
];

/**
 * Mobile preview of the wider site. Each frame loads a real route in an iframe
 * sized to one device width, so every page can be checked at mobile
 * dimensions without opening a device or resizing a window.
 *
 * Frames are lazily mounted and only once they scroll into view, so the page
 * does not boot five copies of the app on load.
 */
export default function MobilePreviewGrid() {
  const d = PREVIEW_DEVICE;

  return (
    <motion.div
      className="mt-20 w-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.7 }}
    >
      <div className="text-center mb-10">
        <p className="text-caption tracking-widest uppercase text-gold-300/60 mb-3">
          Every Screen
        </p>
        <h3 className="font-serif-display text-2xl md:text-3xl text-warmwhite mb-3" style={{ fontWeight: 300 }}>
          The Whole Site In Mobile View
        </h3>
        <p className="text-coolgray text-sm max-w-xl mx-auto">
          Each frame below is a real page at {d.width}px wide — the same
          width a phone reports. Scroll them, tap them, they are live.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 max-w-6xl mx-auto">
        {ROUTES.map((route) => (
          <div key={route.path} className="flex flex-col items-center">
            <PhoneFrame
              caption={null}
              maxHeight="64vh"
              glow={false}
            >
              <iframe
                src={route.path}
                title={`${route.title} — mobile preview`}
                loading="lazy"
                scrolling="yes"
                className="h-full w-full border-0 bg-deepnight"
                // The frame is decorative navigation-free chrome; the real page
                // inside is fully interactive.
              />
            </PhoneFrame>

            <div className="text-center mt-5 px-2">
              <a
                href={route.path}
                className="font-serif-display text-lg text-warmwhite hover:text-gold-300 transition-colors"
              >
                {route.title}
              </a>
              <p className="text-muted text-xs mt-0.5">{route.note}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
