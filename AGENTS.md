# AGENTS.md — Velora Tarot Project

## Project Overview

**Velora Tarot** is a mystical tarot reading website that has been transformed into a polished **Tarot Drawing Mini App** experience. The project preserves all existing functionality while refocusing the core experience into a mobile-first, Mini-App-ready flow.

**What the project currently is:** A Next.js 14 application with 78 tarot cards, 3D card flipping animations, multiple reading types, and a Cloudflare Workers backend.

**What the new Tarot Mini App experience is:** A streamlined, mobile-first 3-card drawing experience: Choose a category (Love / Health / Business / Wealth / Travel) → Category confirmation → Deck appears → Cards shuffle → User draws Card 1 (Current Energy) → Card 2 (Influence / Challenge) → Card 3 (Guidance / Direction) → Cards are revealed one by one and placed into the spread → Card-by-card category-aware reading → Overall reading → Draw Again.

**Parts of the existing project being reused:**
- All 78 tarot card data definitions (`data/tarotCards.ts`)
- TypeScript type definitions (`data/types.ts`)
- Tarot utility functions (`utils/tarotUtils.ts`)
- Sound service (`services/soundService.ts`)
- Reading persistence service (`services/readingService.ts`)
- Shared hooks (`hooks/useShared.ts`) — `useReducedMotion`, `useLocalStorage`, `useSoundEnabled`
- Card components (`components/tarot/CardFront.tsx`, `CardBack.tsx`, `TarotCard.tsx`)
- Star background (`components/StarBackground.tsx`)
- Navigation (`components/Navigation.tsx`)
- Global CSS design tokens and glass effects (`app/globals.css`)
- Tailwind config with mystical color palette (`tailwind.config.ts`)
- Error boundary and loading states
- Cloudflare Workers backend (admin API, D1, R2)
- All reading type interpretations and meanings

## Actual Tech Stack

| Category | Tool |
|---|---|
| **Framework** | Next.js 14.2.5 (App Router) |
| **Language** | TypeScript 5.6.3 |
| **Package Manager** | npm (via package-lock.json) |
| **CSS/Styling** | Tailwind CSS 3.4.15 + CSS custom properties + Tailwind Typography plugin |
| **Animations** | Framer Motion 11.11.17 |
| **Routing** | Next.js App Router |
| **State Management** | React `useState`/`useEffect` (no Redux/Zustand) |
| **Backend** | Cloudflare Workers (wrangler.toml) |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Auth** | JWT-based admin auth (Cloudflare Workers middleware) |
| **Deployment** | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| **Icons** | Lucide React (for UI icons), custom SVG for tarot cards |
| **Fonts** | Cormorant Garamond (serif display), DM Sans (sans body) |

## Project Structure

```
Tarot Website/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage (hero + reading types)
│   ├── layout.tsx                # Root layout (fonts, metadata, viewport)
│   ├── globals.css               # Global styles, design tokens, glass effects
│   ├── error.tsx                 # Error boundary
│   ├── loading.tsx               # Loading state
│   ├── not-found.tsx             # 404 page
│   ├── about/page.tsx            # About page
│   ├── explorer/page.tsx         # Tarot card explorer
│   ├── readings/
│   │   ├── layout.tsx            # Readings layout wrapper
│   │   ├── page.tsx              # Reading type selection
│   │   ├── [type]/
│   │   │   ├── layout.tsx        # Pass-through (must stay a server component)
│   │   │   ├── page.tsx          # Category-first drawing entry
│   │   │   └── [id]/page.tsx     # Result page for saved readings
│   │   └── history/page.tsx      # Reading history
│   └── mini-app/                 # Mini App experience
│       └── page.tsx              # Streamlined Mini App entry
├── components/
│   ├── tarot/
│   │   ├── MiniAppDrawing.tsx    # Main card drawing state machine
│   │   ├── MiniAppCard.tsx       # Card with 3D flip (deck / slot / fluid)
│   │   ├── TarotCard.tsx         # Card used by the saved-reading detail page
│   │   ├── CardFront.tsx         # Card front display
│   │   └── CardBack.tsx          # Card back SVG design
│   ├── brand/
│   │   ├── Logo.tsx              # Velora logo
│   │   └── IntroAnimation.tsx    # 6-phase intro animation
│   ├── reading/
│   │   ├── ReadingTypeCard.tsx   # Reading type selection card
│   │   ├── SoundToggle.tsx       # Sound toggle button
│   │   └── MiniAppNavBar.tsx     # Minimal nav for Mini App (NEW)
│   ├── Navigation.tsx            # Main navigation
│   └── StarBackground.tsx        # Canvas star background
├── data/
│   ├── tarotCards.ts             # 78-card tarot dataset (22 Major + 56 Minor)
│   └── types.ts                  # TypeScript interfaces (TarotCardData, Orientation, ReadingType)
├── hooks/
│   └── useShared.ts              # useReducedMotion, useLocalStorage, useSoundEnabled
├── lib/
│   ├── tarot-engine.ts           # Tarot card engine (NEW)
│   └── platform-adapter.ts       # Platform abstraction (NEW)
├── services/
│   ├── readingService.ts         # Reading persistence (localStorage + KV)
│   └── soundService.ts           # Sound effects (Web Audio API)
├── utils/
│   ├── tarotUtils.ts             # Card lookup, shuffling, interpretations
│   └── dateUtils.ts              # Date formatting
├── worker/                       # Cloudflare Worker (admin API)
│   ├── src/
│   │   ├── index.ts              # Worker entry point
│   │   ├── types.ts              # Env and JWT types
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT auth middleware
│   │   │   └── rateLimit.ts      # Rate limiting
│   │   ├── routes/admin/         # Admin API routes
│   │   └── services/             # Validation, queries, audit, seed
│   ├── migrations/
│   │   └── 0001_init.sql         # D1 database schema
│   └── tsconfig.json
├── scripts/
│   └── seed.ts                   # Database seed script
├── shared/
│   └── admin.ts                  # Shared TypeScript interfaces
├── admin/                        # Admin panel (separate build)
├── node_modules/
├── .next/                        # Build output
├── app/icon.svg                  # Velora mark — the icon source of truth.
│                                 #   Next serves it; browsers render SVG fine.
│                                 #   Do NOT rename to apple-touch-icon.* —
│                                 #   the convention is apple-icon.* and the
│                                 #   wrong name is silently ignored.
├── app/apple-icon.png            # 180x180, generated from icon.svg. iOS
│                                 #   ignores SVG for the home-screen icon.
├── app/favicon.ico               # 16/32/48, generated from icon.svg. Covers
│                                 #   the bare /favicon.ico probe.
│                                 #   Regenerate both:
│                                 #     node scripts/generate-icons.mjs
├── scripts/generate-icons.mjs    # Icon generator (needs sharp; transitive
│                                 #   via Next, so not yet a declared dep)
├── wrangler.toml                 # Cloudflare Pages config
├── wrangler.admin.toml           # Cloudflare Worker config
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── tsconfig.json                 # TypeScript config (paths: @/*, @shared/*)
├── package.json                  # Dependencies and scripts
├── AGENTS.md                   # This file
└── test.md                       # Testing report
```

## Tarot Architecture

### Tarot Card Data

All 78 cards defined in `data/tarotCards.ts`:
- **22 Major Arcana** (The Fool through The World)
- **56 Minor Arcana** (Wands, Cups, Swords, Pentacles — Ace through King)

Each card has:
- `id`, `name`, `arcana`, `suit`, `number`, `keywords`
- `uprightMeaning`, `reversedMeaning`
- `loveUpright`, `loveReversed`, `careerUpright`, `careerReversed`
- `generalUpright`, `generalReversed`
- `advice`, `symbolism`

### Card Selection

The Tarot Engine (`lib/tarot-engine.ts`) handles card selection:
1. `selectRandomCard()` — Picks a random card from the deck
2. `selectCard(cardId)` — Selects a specific card by ID
3. `determineOrientation()` — Randomly assigns upright or reversed (50/50)

### Randomization

Uses Fisher-Yates shuffle (`shuffleArray` from `utils/tarotUtils.ts`):
- Creates a shuffled copy of the deck
- Cards are drawn from the shuffled deck without replacement
- `generateOrientation()` returns `"upright"` or `"reversed"`

### Orientation Logic

`generateOrientation()` uses `Math.random() > 0.5` to determine orientation. Each card draw has an equal probability of being upright or reversed.

### Result Generation

`getCardInterpretation()` from `utils/tarotUtils.ts`:
- Selects the correct meaning field based on `readingType` (love, career, general, daily)
- Selects upright or reversed meaning based on orientation
- Returns the interpretation string

### Reading Types (legacy routes)

- **Daily** — 1 card, general interpretation
- **Love** — 3 cards (Past, Present, Future)
- **Career** — 3 cards (Past, Present, Future)
- **General** — 3 cards (Past, Present, Future)

## Category System (Mini App)

The Mini App is category-first. The user picks exactly one category before any
card is drawn:

```typescript
type TarotCategory = "love" | "health" | "business" | "wealth" | "travel";
```

Each category maps onto the existing card data without duplicating it:
- `love` → `loveUpright` / `loveReversed`
- `business` → `careerUpright` / `careerReversed`
- `health` / `wealth` / `travel` → `generalUpright` / `generalReversed`,
  reframed by a category × position lead-in sentence.

Category definitions, position metadata, interpretation composition and the
deterministic overall-reading builder live in `utils/tarotReading.ts`:

```typescript
type TarotPosition =
  | "current-energy"       // Card 1 — what energy surrounds the category
  | "influence-challenge"  // Card 2 — what is influencing the situation
  | "guidance-direction";  // Card 3 — what to consider next
```

`getCategoryCardReading(card, orientation, category, position)` returns the
category-aware interpretation of a single card. Health language is
deliberately non-diagnostic (wellbeing, rest, balance, self-care) with a
visible disclaimer on the result screen.

`composeOverallReading(category, cards, getCard)` weaves the three cards into
one coherent, rule-based overall reading for the category. It takes no
interpretation callback: it derives each clause from the card data itself, so
the position lead-in is never spliced into the narrative (the clause already
states the position) and no part of a card's meaning is truncated.

### 3-Card Spread Rules

- The three cards in a spread are always unique (no card repeats within a reading).
- Draw Again generates a full new 3-card spread; the three cards of the
  immediately previous spread are excluded from the next one.
- Across different readings, cards may appear again.
- Card positions never change with the category; only the framing does.

### Reroll / Draw Again

The engine implements recent-result avoidance:
1. Maintains a `recentCards` array (last drawn card IDs)
2. When drawing again, temporarily excludes the most recent card(s)
3. Cards are never permanently removed from the deck
4. After a new draw, the recent card list is updated
5. Any card can eventually return after a reasonable number of draws

## Design Rules

### Visual Direction

- **Dark mystical aesthetic**: Deep black (`#06060f`) with cosmic indigo/violet gradients
- **Premium appearance**: Gold accents (`#d4b85a`), glassmorphism, subtle glows
- **Mobile-first**: Designed for 360px–412px width devices
- **Smooth animations**: Framer Motion with GPU-accelerated transforms
- **High-quality card interactions**: 3D flips, hover tilt, touch feedback
- **Strong visual hierarchy**: Card names in Cormorant Garamond, interpretations in DM Sans
- **Minimal interface**: Clean layouts, no clutter, focused on the cards
- **Fast loading**: Lightweight, no heavy dependencies beyond Framer Motion + Tailwind

### Color Palette

- `midnight` (#0a0a1a) — Secondary background
- `deepnight` (#06060f) — Primary background
- `indigo-950` (#1a0a3e) — Cosmic accent
- `gold-200/300/400/500` (#d4b85a family) — Primary accent
- `moonlight` (#c8c2d8) — Secondary text
- `warmwhite` (#f0ebe6) — Primary text
- `coolgray` (#8a8595) — Tertiary text
- `muted` (#5c5769) — Disabled/placeholder text

### Typography

- **Display**: Cormorant Garamond (serif) — card names, headings
- **Body**: DM Sans (sans) — UI text, interpretations
- Responsive sizing with `clamp()` for mobile compatibility

## Mini App Rules

### Mobile-First Design

- Target widths: 360px, 375px, 390px, 412px
- Portrait orientation only
- Touch targets ≥ 44px where practical
- No horizontal scrolling
- No fixed elements covering content
- Buttons must not touch screen edges (safe padding)

### Lightweight Bundle

- No unnecessary dependencies
- Framer Motion is the only animation library
- Canvas-based particle effects limited to essential scenes
- Lazy loading for non-critical components
- Tree-shakeable imports

### WebView-Friendly Behavior

- No browser-specific APIs without fallbacks
- `navigator.share` used conditionally (with clipboard fallback)
- `navigator.clipboard` used conditionally (with alert fallback)
- `AudioContext` wrapped in try-catch
- `matchMedia` for reduced motion detection
- Safe area insets for notched devices

### No Unnecessary Desktop Features

- No complex mouse hover effects (mobile touch equivalents)
- No multi-window or tab interactions
- No heavy desktop-only navigation
- Responsive grid layouts collapse to single column on mobile

### No KBZPay Dependencies

- No invented KBZPay SDK methods, APIs, or authentication flows
- Platform-specific functionality isolated behind adapter interfaces
- Web implementation provided as default
- KBZPay integration only when official documentation is available

### Platform Abstraction

```typescript
interface PlatformAdapter {
  getUserContext(): Promise<UserContext | null>;
  closeApp(): void;
  share(): Promise<void>;
}
```

Web/default implementation provided. KBZPay implementation can be plugged in later.

## Development Rules

1. **Inspect before modifying** — Always read the repository before changing code
2. **Preserve working functionality** — Never break the existing website
3. **Reuse existing components** — CardFront, CardBack, TarotCard, StarBackground, Navigation
4. **Avoid unnecessary rewrites** — Refactor incrementally
5. **Use strict typing** — TypeScript strict mode, no `any` unless unavoidable
6. **Don't introduce dependencies without justification** — All dependencies must serve a clear purpose
7. **Don't change backend architecture** — Keep Cloudflare Workers, D1, R2 as-is
8. **Don't hardcode secrets** — Use environment variables
9. **Don't create fake production APIs** — Only use existing Cloudflare Workers endpoints
10. **Don't add AI** — Tarot results are deterministic from card data, not LLM-generated

## KBZPay Compatibility

The application is architecturally prepared for future KBZPay Mini App integration:

1. **Platform Adapter**: `lib/platform-adapter.ts` provides an abstraction boundary
2. **No Direct Dependencies**: The Tarot Engine (`lib/tarot-engine.ts`) has zero platform dependencies
3. **WebView-Ready**: All pages work in a WebView context
4. **Touch-Optimized**: Primary interaction is touch, not mouse
5. **Lightweight**: Small bundle size suitable for Mini App constraints
6. **Isolated Platform Code**: Any platform-specific code is behind adapter interfaces

**What remains for official KBZPay integration:**
- Wait for official KBZPay Mini App SDK documentation
- Create `platforms/kbzpay/kbzpay-adapter.ts` implementing `PlatformAdapter`
- Add KBZPay authentication flow behind the adapter
- Add KBZPay-specific sharing and payment features behind the adapter
- Test in actual KBZPay WebView environment

## Google Stitch Workflow

Google Stitch Agent Skills are available in this project for visual and interaction design guidance.

### Stitch Skills Installed (16 skills)

**stitch-design** (6 skills):
- `generate-design` — Generate new design screens from text prompts or images
- `manage-design-system` — Manage design systems in Stitch using MCP tools
- `code-to-design` — Convert frontend code to Stitch Design
- `extract-design-md` — Extract design system from frontend source code
- `extract-static-html` — Extract self-contained static HTML
- `upload-to-stitch` — Upload assets to Stitch project

**stitch-build** (3 skills):
- `react-components` — Convert Stitch designs to React components
- `react-native` — Convert Stitch designs to React Native components
- `react-vite-dashboard` — Convert Stitch designs to React + Vite dashboards
- `remotion` — Generate walkthrough videos
- `shadcn-ui` — shadcn/ui integration guidance

**stitch-utilities** (4 skills):
- `enhance-prompt` — Transform vague UI ideas into optimized prompts
- `design-md` — Analyze projects and synthesize design systems
- `stitch-loop` — Iterative website building with autonomous loop pattern
- `site-md` — Synthesize project constitution into SITE.md
- `taste-design` — Semantic design system generation

### How Stitch Was Used

1. **Design Inspiration**: Stitch skill descriptions guided the visual direction
2. **Prompt Enhancement**: Used `enhance-prompt` skill principles for refined descriptions
3. **Design Mappings**: Applied Stitch design terminology (luxury, dark mode, glassmorphism)
4. **Interaction Design**: Used Stitch card-drawing design patterns for the Tarot experience
5. **Visual Language**: Applied "Electric, high-contrast accents on deep slate" + "Elegant, spacious, serif headers"

### Stitch Design Principles Applied

From the Stitch `generate-design` skill:
- **Platform**: Mobile-first, Web/Mobile
- **Theme**: Dark theme with high-contrast accents on near-black backgrounds
- **Vibe**: Luxury + Electric (elegant, spacious, serif headers, gold accents)
- **Shape**: Softly rounded (`rounded-xl`, `rounded-2xl`), pill-shaped buttons
- **Depth**: Floating elevation for selected cards, whisper-soft shadows
- **Glassmorphism**: Semi-transparent surfaces with background blur for panels

### Stitch MCP Note

The Stitch MCP server (`https://stitch.googleapis.com/mcp`) requires OAuth2 authentication, not API keys. The local environment does not have valid OAuth2 credentials, so live Stitch generation was unavailable. The Stitch **Agent Skills** in `.opencode/skills/` (especially `generate-design`, `enhance-prompt`, `manage-design-system`, `taste-design`) were still applied as the interaction/motion specification: see `docs/STITCH_EXPLORATION.md` for the enhanced prompts and the motion choreography decisions they produced. Once OAuth2 is configured, those prompts can be run as-is in Stitch to produce reference screens.

## Mini App Rules

### Mobile-First Design

- Target widths: 360px, 375px, 390px, 412px
- Portrait orientation only
- Touch targets ≥ 44px where practical
- No horizontal scrolling
- No fixed elements covering content
- Buttons must not touch screen edges (safe padding)

### Lightweight Bundle

- No unnecessary dependencies
- Framer Motion is the only animation library
- Canvas-based particle effects limited to essential scenes
- Lazy loading for non-critical components
- Tree-shakeable imports

### WebView-Friendly Behavior

- No browser-specific APIs without fallbacks
- `navigator.share` used conditionally (with clipboard fallback)
- `navigator.clipboard` used conditionally (with alert fallback)
- `AudioContext` wrapped in try-catch
- `matchMedia` for reduced motion detection
- Safe area insets for notched devices

### No Unnecessary Desktop Features

- No complex mouse hover effects (mobile touch equivalents)
- No multi-window or tab interactions
- No heavy desktop-only navigation
- Responsive grid layouts collapse to single column on mobile

### No KBZPay Dependencies

- No invented KBZPay SDK methods, APIs, or authentication flows
- Platform-specific functionality isolated behind adapter interfaces
- Web implementation provided as default
- KBZPay integration only when official documentation is available

### Platform Abstraction

```typescript
interface PlatformAdapter {
  getUserContext(): Promise<UserContext | null>;
  closeApp(): void;
  share(): Promise<void>;
}
```

Web/default implementation provided. KBZPay implementation can be plugged in later.

## Development Rules

1. **Inspect before modifying** — Always read the repository before changing code
2. **Preserve working functionality** — Never break the existing website
3. **Reuse existing components** — CardFront, CardBack, TarotCard, StarBackground, Navigation
4. **Avoid unnecessary rewrites** — Refactor incrementally
5. **Use strict typing** — TypeScript strict mode, no `any` unless unavoidable
6. **Don't introduce dependencies without justification** — All dependencies must serve a clear purpose
7. **Don't change backend architecture** — Keep Cloudflare Workers, D1, R2 as-is
8. **Don't hardcode secrets** — Use environment variables
9. **Don't create fake production APIs** — Only use existing Cloudflare Workers endpoints
10. **Don't add AI** — Tarot results are deterministic from card data, not LLM-generated
11. **Use Stitch skills** — Consult Stitch Agent Skills for visual/interaction design guidance

## KBZPay Compatibility

The application is architecturally prepared for future KBZPay Mini App integration:

1. **Platform Adapter**: `lib/platform-adapter.ts` provides an abstraction boundary
2. **No Direct Dependencies**: The Tarot Engine (`lib/tarot-engine.ts`) has zero platform dependencies
3. **WebView-Ready**: All pages work in a WebView context
4. **Touch-Optimized**: Primary interaction is touch, not mouse
5. **Lightweight**: Small bundle size suitable for Mini App constraints
6. **Isolated Platform Code**: Any platform-specific code is behind adapter interfaces

**What remains for official KBZPay integration:**
- Wait for official KBZPay Mini App SDK documentation
- Create `platforms/kbzpay/kbzpay-adapter.ts` implementing `PlatformAdapter`
- Add KBZPay authentication flow behind the adapter
- Add KBZPay-specific sharing and payment features behind the adapter
- Test in actual KBZPay WebView environment

## State Management

The application uses React `useState`/`useEffect` (no external state management library). The minimum conceptual state:

```typescript
interface MiniAppState {
  category: TarotCategory | null;
  step: 0 | 1 | 2;                     // which card of the spread is drawn
  drawn: SpreadCard[];                  // { cardId, orientation, position }[]
  lastSpreadIds: string[];              // excluded from the next spread
  phase:
    | "category" | "intro" | "shuffling"
    | "selecting" | "revealing" | "placing" | "result";
}
```

## Error Handling

The application handles errors gracefully:
- Missing card data → Shows fallback card name
- Missing card image → CSS gradient fallback (no broken images)
- Invalid reading type → Defaults to "general"
- Empty Tarot dataset → Shows empty state message
- Failed asset loading → `onError` handlers hide problematic elements
- Storage failures → Silently caught, app continues without persistence

## Testing

### Build & Lint Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint -- --quiet  # Lint without interactive prompt
npm run typecheck    # tsc --noEmit
npm run test         # unit (vitest) + e2e (playwright)
npm run test:unit    # pure logic only, fast
npm run test:e2e     # browser regressions, builds and starts a server
```

`test:e2e` runs against a **production** build on port 3210, not `next dev`,
because `reactStrictMode` is on and dev double-invokes effects. It also wipes
`.next` first: Next caches Tailwind's purge output, and a stale stylesheet
served against fresh markup produces false results.

### Testing the Drawing Flow
```
Open → Choose a category → Category confirmation → Shuffle →
Card 1 (Current Energy) → Card 2 (Influence / Challenge) →
Card 3 (Guidance / Direction) → Each card reveals and flies into its slot →
Card-by-card reading → Overall reading → Draw Again
```

### Test Coverage

| Layer | Runner | Covers |
| --- | --- | --- |
| `tests/unit/**` | vitest (node) | Reading composition, spread resolution, card rendering |
| `tests/e2e/**` | Playwright (chromium) | Layout, hit-testing, sessionStorage, routing, assets |

Browser tests exist because most of the defects these guard against are
invisible to typecheck, lint and build — they only appear once something is
measured or tapped.

### Validation Checklist

Verified by `npm run typecheck && npm run lint && npm run build && npm run test`
unless marked otherwise. See `docs/BUG_REPORT.md` for the defect each item
maps to.

- [x] `npm run typecheck` passes
- [x] `npm run build` passes
- [x] `npm run lint` passes — **0 warnings**
- [x] All legacy reading routes resolve (`/readings`, `/readings/love`,
      `/readings/career`, `/readings/daily`, `/readings/general`)
- [x] Unknown reading types return a real 404
- [x] Card shuffle animation plays correctly
- [x] Card selection works on mobile (touch)
- [x] Card flip animation plays
- [x] Result screen displays correctly
- [x] Draw Again creates a new reading
- [x] No duplicate cards within a spread, or against the previous spread
- [x] `prefers-reduced-motion` is respected
- [x] Touch targets are ≥ 44px (every deck card, 360/390/412px)
- [x] No horizontal scrolling on 320–412px, on every route
- [x] A cold session can complete a reading from any `/readings` deep link
- [x] A saved reading's detail page uses the category it was drawn under
- [x] No failing asset requests on any route
- [x] Stitch Agent Skills documented and integrated
- [ ] Landscape layout — out of scope, Mini App is portrait only
- [ ] 320px deck — five cards cannot all reach 44px there; see
      `NUM_VISIBLE` in `components/tarot/MiniAppDrawing.tsx`
