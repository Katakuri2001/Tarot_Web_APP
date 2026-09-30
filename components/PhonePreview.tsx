"use client";

import MiniAppDrawing from "@/components/tarot/MiniAppDrawing";
import PhoneFrame, { PREVIEW_DEVICE } from "@/components/PhoneFrame";

/**
 * Live preview of the drawing experience, rendered inside real device
 * dimensions so the shuffle, selection and reveal animations can be judged at
 * mobile size.
 */
export default function PhonePreview() {
  const d = PREVIEW_DEVICE;

  return (
    <PhoneFrame caption={`${d.width} × ${d.height} · ${d.name}`}>
      <MiniAppDrawing embedded />
    </PhoneFrame>
  );
}
