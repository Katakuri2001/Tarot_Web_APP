import { motion } from "framer-motion";

interface CardBackProps {
  className?: string;
}

export default function CardBack({ className = "" }: CardBackProps) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 300" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="cardBackBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0a3e" />
            <stop offset="100%" stopColor="#06060f" />
          </linearGradient>
          <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4b85a" stopOpacity="0" />
            <stop offset="50%" stopColor="#d4b85a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4b85a" stopOpacity="0" />
          </linearGradient>
          <pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#c8c2d8" opacity="0.4" />
            <circle cx="5" cy="5" r="0.3" fill="#d4b85a" opacity="0.3" />
            <circle cx="15" cy="15" r="0.3" fill="#d4b85a" opacity="0.3" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width="200" height="300" rx="12" fill="url(#cardBackBg)" />
        <rect width="200" height="300" rx="12" fill="url(#stars)" />

        {/* Inner border */}
        <rect x="10" y="10" width="180" height="280" rx="8" fill="none" stroke="#d4b85a" strokeWidth="0.5" opacity="0.3" />
        <rect x="16" y="16" width="168" height="268" rx="6" fill="none" stroke="#d4b85a" strokeWidth="0.3" opacity="0.2" />

        {/* Top arc */}
        <path d="M 20 100 Q 100 30 180 100" fill="none" stroke="url(#goldLine)" strokeWidth="1" opacity="0.5" />
        <path d="M 30 110 Q 100 50 170 110" fill="none" stroke="url(#goldLine)" strokeWidth="0.5" opacity="0.3" />

        {/* Bottom arc */}
        <path d="M 20 200 Q 100 270 180 200" fill="none" stroke="url(#goldLine)" strokeWidth="1" opacity="0.5" />
        <path d="M 30 190 Q 100 250 170 190" fill="none" stroke="url(#goldLine)" strokeWidth="0.5" opacity="0.3" />

        {/* Side arcs */}
        <path d="M 100 20 Q 170 100 100 180" fill="none" stroke="url(#goldLine)" strokeWidth="0.5" opacity="0.2" />
        <path d="M 100 20 Q 30 100 100 180" fill="none" stroke="url(#goldLine)" strokeWidth="0.5" opacity="0.2" />

        {/* Center symbol */}
        <circle cx="100" cy="150" r="25" fill="none" stroke="#d4b85a" strokeWidth="0.5" opacity="0.4" />
        <circle cx="100" cy="150" r="20" fill="none" stroke="#d4b85a" strokeWidth="0.3" opacity="0.3" />

        {/* Crescent moon in center */}
        <path
          d="M 110 138C 100 142 95 150 95 158C 95 166 100 174 110 178C 105 172 103 165 105 158C 107 151 113 144 110 138Z"
          fill="#d4b85a"
          opacity="0.7"
        />
        <circle cx="103" cy="156" r="2" fill="#f0ebe6" opacity="0.8" />

        {/* Decorative dots */}
        <circle cx="100" cy="122" r="1.5" fill="#d4b85a" opacity="0.5" />
        <circle cx="100" cy="178" r="1.5" fill="#d4b85a" opacity="0.5" />
        <circle cx="72" cy="150" r="1.5" fill="#d4b85a" opacity="0.5" />
        <circle cx="128" cy="150" r="1.5" fill="#d4b85a" opacity="0.5" />

        {/* Velora text */}
        <text
          x="100"
          y="285"
          textAnchor="middle"
          fill="#d4b85a"
          fontFamily="Cormorant Garamond, serif"
          fontSize="8"
          letterSpacing="3"
          opacity="0.6"
        >
          VELORA
        </text>
      </svg>
    </div>
  );
}
