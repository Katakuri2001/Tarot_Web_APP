"use client";

import type { ReactNode } from "react";
import { PREVIEW_DEVICE } from "@/components/PhoneFrame";

/**
 * Device shell dimensions, in CSS pixels. These match the design markup
 * exactly: w-[160px] h-[300px] with a border-4 frame.
 */
const SHELL_W = 160;
const SHELL_H = 300;
/** Tailwind's `border-4` — the frame ring eats into the declared size. */
const BORDER = 4;
/** Height of the `h-2` notch hanging from the top edge. */
const NOTCH_H = 8;

interface RetroPhoneProps {
  children: ReactNode;
  /** Optional label rendered under the device. */
  caption?: ReactNode;
  /** Disable the drop shadow if the phone sits inside another elevated surface. */
  flat?: boolean;
}

/**
 * Phone shell used by the mobile preview grid.
 *
 * The screen is rendered at true device dimensions (PREVIEW_DEVICE) and then
 * scaled down to fit the shell, rather than laying content out at the shell's
 * 152px width. That matters: at 152px a page would render in a viewport no
 * phone has, so the preview would not reflect the real mobile layout. Scaling
 * preserves the real breakpoint behaviour, wraps and font sizes, just
 * visually smaller.
 */
export default function RetroPhone({ children, caption, flat = false }: RetroPhoneProps) {
  const d = PREVIEW_DEVICE;

  // Usable screen area inside the frame and below the notch.
  const innerW = SHELL_W - BORDER * 2;
  const innerH = SHELL_H - BORDER * 2 - NOTCH_H;

  // Fit the whole device viewport inside that area without cropping.
  const scale = Math.min(innerW / d.width, innerH / d.height);
  const contentW = Math.round(d.width * scale);
  const contentH = Math.round(d.height * scale);
  const offsetX = Math.round((innerW - contentW) / 2);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex justify-center h-[300px] w-[160px] border border-4 border-black rounded-2xl bg-gray-50"
        style={flat ? undefined : { boxShadow: "5px 5px 2.5px 6px rgb(209, 218, 218)" }}
      >
        {/* Notch */}
        <span className="absolute top-0 border border-black bg-black w-20 h-2 rounded-br-xl rounded-bl-xl" />

        {/* Side buttons */}
        <span className="absolute -right-2 top-14 border border-4 border-black h-7 rounded-md" />
        <span className="absolute -right-2 bottom-36 border border-4 border-black h-10 rounded-md" />

        {/* Screen: real device viewport, scaled to fit the shell */}
        <div
          className="absolute overflow-hidden bg-deepnight"
          style={{
            left: BORDER + offsetX,
            top: BORDER + NOTCH_H,
            width: contentW,
            height: contentH,
          }}
        >
          <div
            style={{
              width: d.width,
              height: d.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {caption && <div className="mt-4 text-center px-1">{caption}</div>}
    </div>
  );
}
