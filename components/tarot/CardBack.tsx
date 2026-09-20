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
            <stop offset="50%" stopColor="#12082e" />
            <stop offset="100%" stopColor="#06060f" />
          </linearGradient>
          <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4b85a" stopOpacity="0" />
            <stop offset="40%" stopColor="#d4b85a" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#d4b85a" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#d4b85a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d4b85a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldVertical" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4b85a" stopOpacity="0" />
            <stop offset="30%" stopColor="#d4b85a" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#d4b85a" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#d4b85a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#d4b85a" stopOpacity="0" />
          </linearGradient>
          <pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.4" fill="#c8c2d8" opacity="0.3" />
            <circle cx="5" cy="5" r="0.25" fill="#d4b85a" opacity="0.2" />
            <circle cx="15" cy="15" r="0.25" fill="#d4b85a" opacity="0.2" />
            <circle cx="18" cy="8" r="0.2" fill="#c8c2d8" opacity="0.15" />
          </pattern>
          <radialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d4b85a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#d4b85a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="200" height="300" rx="12" fill="url(#cardBackBg)" />
        <rect width="200" height="300" rx="12" fill="url(#stars)" />
        <rect width="200" height="300" rx="12" fill="url(#centerGlow)" />
        <rect width="200" height="300" rx="12" fill="url(#goldVertical)" />

        {/* Outer border */}
        <rect x="2" y="2" width="196" height="296" rx="11" fill="none" stroke="#d4b85a" strokeWidth="0.8" opacity="0.25" />
        {/* Inner border */}
        <rect x="8" y="8" width="184" height="284" rx="8" fill="none" stroke="#d4b85a" strokeWidth="0.4" opacity="0.15" />
        {/* Innermost border */}
        <rect x="12" y="12" width="176" height="276" rx="6" fill="none" stroke="#d4b85a" strokeWidth="0.2" opacity="0.1" />

        {/* Top decorative arc */}
        <path d="M 25 110 Q 100 35 175 110" fill="none" stroke="url(#goldLine)" strokeWidth="0.8" opacity="0.4" />
        <path d="M 35 120 Q 100 55 165 120" fill="none" stroke="url(#goldLine)" strokeWidth="0.4" opacity="0.25" />

        {/* Bottom decorative arc */}
        <path d="M 25 190 Q 100 265 175 190" fill="none" stroke="url(#goldLine)" strokeWidth="0.8" opacity="0.4" />
        <path d="M 35 180 Q 100 255 165 180" fill="none" stroke="url(#goldLine)" strokeWidth="0.4" opacity="0.25" />

        {/* Side arcs */}
        <path d="M 100 15 Q 170 100 100 185" fill="none" stroke="url(#goldLine)" strokeWidth="0.4" opacity="0.2" />
        <path d="M 100 15 Q 30 100 100 185" fill="none" stroke="url(#goldLine)" strokeWidth="0.4" opacity="0.2" />

        {/* Celestial circle */}
        <circle cx="100" cy="150" r="30" fill="none" stroke="#d4b85a" strokeWidth="0.4" opacity="0.2" />
        <circle cx="100" cy="150" r="25" fill="none" stroke="#d4b85a" strokeWidth="0.3" opacity="0.15" />
        <circle cx="100" cy="150" r="20" fill="none" stroke="#d4b85a" strokeWidth="0.2" opacity="0.1" />

        {/* Inner geometric pattern */}
        <polygon points="100,120 115,150 100,180 85,150" fill="none" stroke="#d4b85a" strokeWidth="0.3" opacity="0.15" />
        <circle cx="100" cy="150" r="8" fill="none" stroke="#d4b85a" strokeWidth="0.3" opacity="0.2" />

        {/* Crescent moon */}
        <path
          d="M 112 135C 102 139 97 148 97 156C 97 164 102 173 112 177C 107 171 105 164 107 157C 109 150 115 143 112 135Z"
          fill="#d4b85a"
          opacity="0.5"
        />
        <circle cx="104" cy="155" r="1.8" fill="#f0ebe6" opacity="0.7" />

        {/* Decorative dots */}
        <circle cx="100" cy="125" r="1.2" fill="#d4b85a" opacity="0.4" />
        <circle cx="100" cy="175" r="1.2" fill="#d4b85a" opacity="0.4" />
        <circle cx="72" cy="150" r="1.2" fill="#d4b85a" opacity="0.4" />
        <circle cx="128" cy="150" r="1.2" fill="#d4b85a" opacity="0.4" />

        {/* Small diamond accents */}
        <polygon points="100,118 102,120 100,122 98,120" fill="#d4b85a" opacity="0.3" />
        <polygon points="100,178 102,180 100,182 98,180" fill="#d4b85a" opacity="0.3" />

        {/* Velora text */}
        <text
          x="100"
          y="285"
          textAnchor="middle"
          fill="#d4b85a"
          fontFamily="Cormorant Garamond, serif"
          fontSize="7"
          letterSpacing="2.5"
          opacity="0.5"
        >
          VELORA
        </text>
      </svg>
    </div>
  );
}