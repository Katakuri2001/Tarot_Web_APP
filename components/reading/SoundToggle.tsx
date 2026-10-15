"use client";

import { useSoundEnabled } from "@/hooks/useShared";

export function SoundToggle() {
  const [enabled, toggle] = useSoundEnabled();

  return (
    <button
      onClick={toggle}
      // The icon is 18px inside `p-1`, giving a 26x26 target — under the 44x44
      // minimum in WCAG 2.5.5. A transparent pseudo-element extends the
      // tappable area to 46x46 without changing the header's height, which the
      // pages below rely on staying at 64px.
      className="text-moonlight hover:text-gold-300 transition-colors p-1 relative after:absolute after:content-[''] after:-inset-2.5"
      aria-label={enabled ? "Sound on" : "Sound off"}
      title={enabled ? "Sound on" : "Sound off"}
    >
      {enabled ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
