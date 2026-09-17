export default function Logo({ size = "full", className = "" }: { size?: "full" | "compact" | "small"; className?: string }) {
  const showText = size === "full";
  const showTextShort = size === "compact";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size === "full" ? 40 : 28}
        height={size === "full" ? 40 : 28}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Velora logo symbol"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4b85a" />
            <stop offset="100%" stopColor="#bfa055" />
          </linearGradient>
          <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d4b85a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d4b85a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#moonGlow)" />
        <path
          d="M24 8C18.5 10 14 16 14 22C14 28 18.5 34 24 36C20 32 19 27 21 22C23 17 27 13 24 8Z"
          fill="url(#moonGrad)"
          opacity="0.95"
        />
        <circle cx="22" cy="20" r="2.5" fill="#f0ebe6" opacity="0.9" />
        <path d="M22 17.5L22.8 19.5H24.8L23.2 20.7L23.8 22.7L22 21.5L20.2 22.7L20.8 20.7L19.2 19.5H21.2L22 17.5Z" fill="#0a0a1a" opacity="0.6" />
      </svg>
      {showText && (
        <span className="font-serif-display text-xl tracking-wide text-warmwhite" style={{ fontWeight: 500 }}>
          Velora
        </span>
      )}
      {showTextShort && (
        <span className="font-serif-display text-sm tracking-wide text-warmwhite" style={{ fontWeight: 500 }}>
          Velora
        </span>
      )}
    </div>
  );
}
