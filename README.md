# Velora — Mystical Tarot Website

**Velora** is a cinematic, mystical tarot reading experience built with modern web technologies. Rediscover tarot with a dark, atmospheric interface where cards spring to life through fluid animations and meaningful interpretations.

---

## 📖 Overview

Velora transforms the tarot reading experience into a mystical "table" interface. Users select a reading type (Daily, Love, Career, or General), shuffle the deck, choose cards, and receive detailed interpretations — all within an immersive, 3D card-flipping experience driven by Framer Motion.

The redesign preserves all existing backend logic (D1, R2, API, auth, history, admin) while overhauling the frontend UI/UX with:

- A state-machine driven card picking/reveal flow
- 3D card flips with hover tilt effects
- Particle background and atmospheric glows
- `prefers-reduced-motion` accessibility support
- Keyboard navigation (Enter/Space to select)
- Touch support on mobile
- Share readings to clipboard or native share
- Saved reading history

---

## 🛠 Technology Stack

| Category | Tools |
|---|---|
| **Framework** | Next.js 14 (app router), React 18 |
| **Styling** | Tailwind CSS 3.4, custom CSS variables |
| **Animations** | Framer Motion 11 |
| **Cards & Data** | Tarot card data (22 Major Arcana + 56 Minor Arcana) |
| **Utilities** | `tailwind-merge`, class weighting helpers |
| **Sound** | Custom sound service (shuffle, flip, reveal) |
| **Deployment** | Cloudflare Workers / Next.js standalone output |
| **Types** | TypeScript 5.6 with `@cloudflare/workers-types` |

### Key Configurations

- **`tsconfig.json`**: `@/*` and `@shared/*` path aliases; `@cloudflare/workers-types` included
- **`tailwind.config.ts`**: Custom color palette (midnight, deepnight, indigo, violet, gold, moonlight, warmwhite, coolgray, muted), custom keyframes for float, pulse, spin, fade-up, star-twinkle
- **`next.config.js`**: `output: "standalone"` for Cloudflare deployment; webpack aliases for canvas/stream/buffer; `poweredByHeader: false`; `images: { unoptimized: true }`
- **`globals.css`**: Dark theme, glass-effect panels, nebula glows, `prefers-reduced-motion` accessibility, custom classes (`font-serif-display`, `glass`, `glass-dark`, `perspective-1000`, `backface-hidden`, `preserve-3d`)

---

## 🔮 Reading Flow

Velora supports four reading types, each with a tailored card flow:

| Reading Type | Cards | Steps |
|---|---|---|
| **Daily** | 1 card | Setup → Intro → Shuffle → Spread → Select → Flip → Reveal → Result |
| **Love** | 3 cards (Past/Present/Future) | Same flow, with step navigation and reshuffle between steps |
| **Career** | 3 cards (Past/Present/Future) | Same flow as Love |
| **General** | 3 cards (Past/Present/Future) | Same flow as Love |

### Single-Card (Daily) Flow

1. **Setup** – Enter your question (optional) and click "Begin Reading"
2. **Intro** – Four guiding lines fade in: "Your reading begins." → "Clear your mind." → "Trust your intuition." → "Choose a card."
3. **Shuffle** – Cards fan out and shuffle randomly (25 particles by default, 8 in reduced-motion)
4. **Spread** – Cards settle into an arc layout; one card is highlighted as selectable
5. **Select** – Hover or press Enter/Space to select the card; other cards dim
6. **Flip** – Selected card flips 180° to reveal its imagery
7. **Revealed** – Card remains face-up; reading details appear
8. **Result** – Summary panel with card name, keywords, interpretation; Share / New Reading actions

### Three-Card (Love/Career/General) Flow

Identical to the daily flow, but includes three sequential steps (Past → Present → Future):

- After each card is revealed, the user can proceed to the next step
- Between steps, the deck reshuffles with new cards
- Final result panel shows all three cards with full interpretations
- Share and New Reading buttons available

---

## 📁 Project Structure

```
tarot-website/
├── app/                    # Next.js app router
│   ├── globals.css        # Global styles, glass effects, reduced-motion
│   ├── layout.tsx         # Root layout with metadata, fonts
│   ├── readings/          # Reading type pages
│   │   └── [type]/page.tsx  # TarotTable container
│   │   └── [type]/[id]/page.tsx  # Reading result page (unchanged)
│   └── readings/layout.tsx  # Navigation, star background, intro animation
├── components/
│   ├── tarot/             # Tarot-specific components
│   │   ├── TarotTable.tsx     # Main state machine & card grid
│   │   ├── TableCard.tsx      # Individual card with tilt/flip
│   │   ├── CardBack.tsx       # Card back SVG
│   │   ├── CardFront.tsx      # Card front display
│   │   ├── TarotCardRevealed.tsx  # 3D flip component
│   │   ├── ReadingDetails.tsx   # Card interpretation panel
│   │   └── TarotParticles.tsx   # Canvas particle background
│   │   └── TarotCursorLight.tsx # Following glow effect
│   ├── brand/           # IntroAnimation, StarBackground, Navigation
│   └── ui/              # Generic UI primitives
├── data/                # Tarot card definitions, types
│   ├── tarotCards.ts    # 78 cards (Major + Minor Arcana)
│   └── types.ts         # TypeScript interfaces
├── services/            # Backend services (sound, reading storage)
│   ├── soundService.ts
│   └── readingService.ts
├── utils/               # Utility functions
│   └── tarotUtils.ts    # Card lookup, shuffling, interpretations
├── hooks/               # Custom React hooks
│   └── useShared.ts     # reduced-motion, sound toggle
├── package.json         # Dependencies (framer-motion, react, next, tailwind)
└── README.md            # This file
```

---

## ⚙️ Running locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

The dev server runs on port 3000. CSS is compiled into `_next/static/css/app/layout.css`.

### Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build (passes after config fixes) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## ♿ Accessibility

- **`prefers-reduced-motion`**: Fully supported — disables tilt hover effects, reduces particle count (25 → 8), shortens all transition durations to minimal values
- **Keyboard navigation**: Each card has `role="button"`, `tabIndex`, and `onKeyDown` for Enter/Space to select
- **Focus visible**: Custom `.focus-visible` outline in globals.css (rgba(212, 184, 90, 0.75))
- **ARIA labels**: Cards announce `name` and `orientation` via `aria-label`
- **Semantic HTML**: Proper heading hierarchy, labels, and button roles

---

## 🎨 Design Highlights

| Feature | Description |
|---|---|
| **Dark theme** | `#06060f` base with radial gradient accents |
| **Glass panels** | Blurred semi-transparent backgrounds with gold borders |
| **Nebula glows** | Abstract blurred color patches in indigo and gold |
| **Particle background** | Canvas-rendered gold dust (25 particles, reduced to 8 in reduced-motion) |
| **3D card flips** | Perspective-1000 with preserve-3d transform style |
| **Hover tilt** | Mouse-driven rotateX/Y on cards (disabled in reduced-motion) |
| **Gold accent** | `#d4b85a` used for highlights, buttons, keywords |
| **Serif display font** | `Cormorant Garamond` for headings and card names |
| **Sans-serif body** | `DM Sans` for UI text |

### Custom CSS Classes

- `.font-serif-display` – Cormorant Garamond fallback stack
- `.glass` – Blurred panel with gold border
- `.glass-dark` – Opaque dark backdrop with blur
- `.perspective-1000` – 1000px perspective for 3D
- `.backface-hidden` – Hides card back during flip
- Reduced-motion media query disables all non-essential animations

---

## 🔄 State Machine (TarotTable)

The core of the redesign is `components/tarot/TarotTable.tsx`, which manages these phases:

```
setup  →  intro  →  shuffling  →  spread  →  selected  →  flipping  →  revealed  →  result
```

Each phase triggers specific animations, card states, and transitions. The flow is driven by:

- `useEffect` listeners per phase
- Timer-based sequencing (respecting `prefers-reduced-motion`)
- `getCardState()` to determine card appearance (idle / selected / dimmed / revealed)
- `isClickable` guard to prevent inputs during animations

### Per-phase behavior

| Phase | Cards visible | Clickable | Key actions |
|---|---|---|---|
| **setup** | None | No | Overlay: question textarea + "Begin Reading" button |
| **intro** | None | No | Guiding text fades in one at a time |
| **shuffling** | 7 (or 4 reduced-motion) random cards | No | Particles animate, cards fan-randomize |
| **spread** | Arc layout | Yes (idle cards only) | Cards settle; one highlighted as selected |
| **selected** | One card highlighted | No | Selected card animates forward; others dim |
| **flipping** | Selected card flips | No | 180° rotateY transition + reveal sound |
| **revealed** | All cards face-up | No | Reading details appear sequentially |
| **result** | 3 cards (or 1 for daily) | No | Summary panel with Share / New Reading |

---

## 📤 Sharing Readings

After a reading is complete, users can share their experience:

- **Native share**: `navigator.share({ title: "Velora Reading", text })` (modern browsers)
- **Clipboard fallback**: `navigator.clipboard.writeText(text)` with alert confirmation
- Shared text format: `"I drew The Fool, The Magician during a Daily Reading at Velora."`

---

## 💾 Saving & History

- Readings are persisted to `localStorage` via `readingService.saveReadingToStorage()`
- Each reading gets a unique ID (`reading__{timestamp}__{random}`)
- History accessible via `/readings/history` (admin/existing functionality)
- Readings can be reloaded from storage on the result page (`app/readings/[type]/[id]/page.tsx`)

---

## 🚀 Deployment

The project builds to Next.js standalone output (`output: "standalone"` in `next.config.js`), suitable for Cloudflare Workers deployment.

```bash
npm run build    # produces .next/standalone/
npm run start    # starts production server
```

Configuration includes:
- Webpack aliases for Cloudflare Assets (`canvas`, `stream`, `buffer`)
- `compress: true` for HTML compression
- `images: { unoptimized: true }` for asset handling
- `poweredByHeader: false` for privacy

---

## 📦 Customization

### Adding new reading types

Edit `data/types.ts` to add a new `ReadingType`, then update:
- `components/tarot/TarotTable.tsx` — `numCards` logic (line 65)
- `utils/tarotUtils.ts` — `getReadingTypePositions()` and `getReadingTypeLabel()`
- `app/readings/[type]/page.tsx` — if custom page logic needed

### Modifying card appearances

- Adjust `.glass`, `.glass-dark` in `app/globals.css`
- Update Tailwind `animation`/`keyframes` in `tailwind.config.ts`
- Change color palette in `tailwind.config.ts` `colors` section

### Adjusting animation timing

All transitions respect `prefers-reduced-motion`. Default durations:
- Shuffle: 2.5s (1.2s reduced)
- Flip: 0.8s (0.3s reduced)
- Transition default: 0.6s (0.01s reduced)
- Particle interval: 120ms (80ms reduced)

---

## 🙏 Acknowledgements

- Tarot card imagery and traditional symbolism
- [Framer Motion](https://framer.com/motion/) for animation primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Next.js](https://nextjs.org/) for the React framework
- [Lucide React](https://lucide.dev/) for icons (though custom SVGs used for cards)

---

*Velora — Trust your intuition. Let the cards reveal another perspective on your journey.*