"use client";

import type { ReactNode } from "react";

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

interface PhoneFrameProps {
  children: ReactNode;
  /** Shown under the device. Pass null to hide the caption. */
  caption?: ReactNode;
  /** Max viewport height, so a grid of frames still fits on screen. */
  maxHeight?: string;
  /** Ambient glow behind the device. */
  glow?: boolean;
}

/**
 * Device chrome shared by every mobile preview: bezel, Dynamic Island, home
 * indicator and the reserved notch strip. The child is rendered inside a
 * viewport that is exactly one device width wide, so layouts measure
 * themselves the same way they would on real hardware.
 */
export default function PhoneFrame({
  children,
  caption,
  maxHeight = "82vh",
  glow = true,
}: PhoneFrameProps) {
  const d = PREVIEW_DEVICE;

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-full" style={{ maxWidth: `min(${d.width}px, 100%)` }}>
        {glow && (
          /*
           * The glow is inset -40px so its halo extends past the device, which
           * used to widen the document by ~24px at every mobile width. Clipping
           * the wrapper instead is not an option: the device body's bezel is a
           * non-inset box-shadow on a sibling, so an ancestor clip would shear
           * the ring off. So the glow gets its own clip layer, flush with the
           * frame.
           *
           * Do not add overflow-clip-margin here. It widens the clip edge, and
           * scrollable overflow is then measured against that wider edge — so a
           * 40px margin reinstates exactly the 24px of horizontal scroll this
           * fixes (verified in-browser: clip+margin = 414, plain clip = 390).
           *
           * Clipping flush is invisible anyway: the radial gradient reaches
           * transparent at 70% of its radius, which lands ~153px from centre,
           * while the clip edge sits ~179px out. Nothing is sheared.
           */
          <div className="absolute inset-0 overflow-clip" aria-hidden="true">
            <div
              className="absolute rounded-[3.5rem] opacity-40 blur-2xl pointer-events-none"
              style={{
                inset: -40,
                background:
                  "radial-gradient(circle at 50% 40%, rgba(212,184,90,0.20) 0%, rgba(26,10,62,0.28) 45%, transparent 70%)",
              }}
            />
          </div>
        )}

        <div
          className="relative mx-auto w-full rounded-[3rem] border border-gold-400/25 bg-deepnight overflow-hidden"
          style={{
            // Keep the real device aspect ratio, but never taller than the
            // caller allows so a grid of frames stays on screen.
            height: `min(${d.height}px, ${maxHeight})`,
            aspectRatio: `${d.width} / ${d.height}`,
            boxShadow: `0 0 0 ${d.bezel}px #0a0a1a, 0 0 0 ${d.bezel + 1}px rgba(212,184,90,0.18), 0 30px 80px rgba(0,0,0,0.7)`,
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0a0a1a] rounded-b-2xl z-40 flex items-center justify-center"
            style={{ width: d.width * 0.32, height: d.topInset }}
          >
            <div className="rounded-full bg-white/10" style={{ width: d.width * 0.16, height: 5 }} />
          </div>

          {/*
            App viewport. Reserving the notch strip means content is never
            hidden behind the Dynamic Island, matching how safe-area insets
            behave on device.
          */}
          <div className="absolute inset-0" style={{ top: d.topInset }}>
            {children}
          </div>

          {/* Home indicator */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-white/15 z-40 pointer-events-none rounded-full"
            style={{ width: d.width * 0.35, height: 5, bottom: 8 }}
          />
        </div>

        {caption && <p className="text-center text-muted text-xs mt-5">{caption}</p>}
      </div>
    </div>
  );
}
