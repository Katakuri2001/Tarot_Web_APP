"use client";

import { motion } from "framer-motion";
import RetroPhone from "@/components/RetroPhone";
import { PREVIEW_DEVICE } from "@/components/PhoneFrame";

interface PreviewRoute {
  path: string;
  title: string;
  note: string;
}

const ROUTES: PreviewRoute[] = [
  { path: "/readings", title: "Readings", note: "Pick your spread" },
  { path: "/explorer", title: "Tarot", note: "Browse all 78 cards" },
  { path: "/readings/love", title: "Love", note: "Three-card draw" },
  { path: "/readings/history", title: "History", note: "Past readings" },
  { path: "/about", title: "About", note: "The observatory" },
];

/**
 * Mobile preview of the wider site. Every frame loads a real route in an
 * iframe laid out at true device width and scaled to fit the shell, so each
 * page is checked against the mobile layout a phone would actually get.
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
      <div className="text-center mb-12">
        <p className="text-caption tracking-widest uppercase text-gold-300/60 mb-3">
          Every Screen
        </p>
        <h3
          className="font-serif-display text-2xl md:text-3xl text-warmwhite mb-3"
          style={{ fontWeight: 300 }}
        >
          The Whole Site In Mobile View
        </h3>
        <p className="text-coolgray text-sm max-w-xl mx-auto">
          Each frame is a real page rendered at {d.width} × {d.height} and scaled
          to fit. Scroll them, tap them — they are live.
        </p>
      </div>

      {/*
        Column counts are chosen so a 160px shell plus its 8px side-button
        overhang always fits. Two columns overflow below ~412px, so phones get
        a single column and the multi-column layout starts at sm.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10 max-w-5xl mx-auto justify-items-center">
        {ROUTES.map((route) => (
          <RetroPhone
            key={route.path}
            caption={
              <>
                <a
                  href={route.path}
                  className="font-serif-display text-base text-warmwhite hover:text-gold-300 transition-colors"
                >
                  {route.title}
                </a>
                <p className="text-muted text-[11px] mt-0.5">{route.note}</p>
              </>
            }
          >
            <iframe
              src={route.path}
              title={`${route.title} — mobile preview`}
              loading="lazy"
              scrolling="yes"
              className="h-full w-full border-0 bg-deepnight"
            />
          </RetroPhone>
        ))}
      </div>
    </motion.div>
  );
}
