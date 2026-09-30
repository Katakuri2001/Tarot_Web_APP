"use client";

import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";

/**
 * Single source of truth for the preview device.
 *
 * NOTE: `width`/`height` are CSS *logical* pixels (CSS pt), which is what a
 * browser reports for `window.innerWidth`/`innerHeight` and what our layout
 * math is measured in. Physical pixels are a different (larger) number.
 *
 * iPhone 17 Pro Max — 6.9" display, 19.5:9 aspect.
 * Adjust here if the spec changes; nothing else hardcodes these values.
 */
export const PREVIEW_DEVICE = {
  name: "iPhone 17 Pro Max",
  width: 440,
  height: 956,
  /** Corner radius of the device body, in px at 1:1 scale. */
  radius: 56,
  /** Width of the simulated bezel/frame ring. */
  bezel: 11,
  /** Height of the notch + status bar strip reserved at the top. */
  topInset: 34,
} as const;

export default function PhonePreview() {
  const d = PREVIEW_DEVICE;

  return (
    <div className="flex justify-center">
      <div
        className="relative w-full max-w-full"
        style={{ maxWidth: `min(${d.width}px, 100%)` }}
      >
        {/* Ambient glow */}
        <div
          className="absolute rounded-[3.5rem] opacity-40 blur-2xl pointer-events-none"
          style={{
            inset: -40,
            background:
              "radial-gradient(circle at 50% 40%, rgba(212,184,90,0.20) 0%, rgba(26,10,62,0.28) 45%, transparent 70%)",
          }}
        />

        {/* Device body */}
        <div
          className="relative mx-auto w-full rounded-[3rem] border border-gold-400/25 bg-deepnight overflow-hidden"
          style={{
            // Keep the real device aspect ratio, but never taller than the
            // viewport so the whole flow stays reachable without scrolling.
            height: `min(${d.height}px, 82vh)`,
            aspectRatio: `${d.width} / ${d.height}`,
            boxShadow: `0 0 0 ${d.bezel}px #0a0a1a, 0 0 0 ${d.bezel + 1}px rgba(212,184,90,0.18), 0 30px 80px rgba(0,0,0,0.7)`,
          }}
        >
          {/* Notch / Dynamic Island */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0a0a1a] rounded-b-2xl z-40 flex items-center justify-center"
            style={{ width: d.width * 0.32, height: d.topInset }}
          >
            <div
              className="rounded-full bg-white/10"
              style={{ width: d.width * 0.16, height: 5 }}
            />
          </div>

          {/* App viewport — reserves the notch strip so content is never
              hidden behind it, matching how safe-area insets behave on device. */}
          <div className="absolute inset-0" style={{ top: d.topInset }}>
            <MiniAppDrawing embedded />
          </div>

          {/* Home indicator */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-white/15 z-40 pointer-events-none rounded-full"
            style={{ width: d.width * 0.35, height: 5, bottom: 8 }}
          />
        </div>

        {/* Caption */}
        <p className="text-center text-muted text-xs mt-5">
          {d.width} × {d.height} · {d.name}
        </p>
      </div>
    </div>
  );
}
