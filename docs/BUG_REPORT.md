# Bug Report — Velora Tarot

**Date:** 2026-10-05
**Baseline commit:** `b1db8ad` *fix(routing): validate the saved-reading route instead of casting it*
**Scope:** Uncommitted working-tree changes that introduce the category-first
3-card Mini App (`utils/tarotReading.ts`, `MiniAppDrawing.tsx` rewrite,
`TarotCategory` / `TarotPosition` / `SpreadCard` types, category-aware routing,
`CardFront` / `MiniAppCard` tweaks).
**Status:** Not fixed. This document is inspection output only.

---

## 1. Verification summary

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npm run lint` | **PASS** — 0 errors, 0 warnings |
| `npm run build` | **PASS** — 11 routes compiled, 4 warnings |
| Automated tests | **NONE EXIST** — see §5 |

Build warnings, all in files untouched by this change:

- `app/layout.tsx:47` — `@next/next/no-page-custom-font`
- `app/page.tsx:106` — `@next/next/no-img-element`
- `components/tarot/TarotTable.tsx:169` — `react-hooks/exhaustive-deps` (`selectedCards`)
- `components/tarot/TarotTable.tsx:232` — `react-hooks/exhaustive-deps` (`sound`)

**No static gate fails.** Every defect below is runtime-only, which is why the
flow had to be driven in a real browser to surface them.

### How these were found

Production server (`next build && next start`) plus headless Chromium via
Playwright:

- Viewports: 320 / 360 / 375 / 390 / 412 / 768 px wide
- Full flow driven end to end: category → confirm → shuffle → 3 card draws →
  reveal → place → result → Draw Again → Change Category
- 8 consecutive Draw Again cycles to exercise the spread rules
- `prefers-reduced-motion: reduce` pass
- Fresh-session vs. warmed-session comparison per route
- Console + `pageerror` capture throughout

---

## 2. Findings at a glance

| # | Sev | Area | Summary |
| --- | --- | --- | --- |
| 1 | **CRITICAL** | routing | Every `/readings/*` route is permanently unclickable on a fresh session |
| 2 | **CRITICAL** | layout | `<NavBar>` rendered twice on `/readings/[type]/*` |
| 3 | HIGH | content | Overall reading double-frames every card and silently drops content |
| 4 | HIGH | layout | "CARD n" status text renders on top of the deck |
| 5 | HIGH | layout | `/` overflows horizontally at every mobile width |
| 6 | MEDIUM | a11y | Outer deck cards expose only ~18–26 px of tappable area |
| 7 | MEDIUM | ui | Major Arcana prints the card number twice |
| 8 | MEDIUM | assets | `public/` missing — 5 asset 404s, 4 of them on every page |
| 9 | MEDIUM | ui | Spread slot captions wrap and go ragged |
| 10 | MEDIUM | routing | `app/readings/daily/page.tsx` shadows `[type]` for the `daily` segment |
| 11 | MEDIUM | data | Saved-reading detail page contradicts the Mini App result |
| 12 | LOW | correctness | `statusTextTop` mixes CSS units and goes stale on resize |
| 13 | LOW | correctness | Leaked `setTimeout` handles in the category picker |

---

## 3. Detailed findings

### 1. CRITICAL — every `/readings/*` route is permanently unclickable on a fresh session

**Files:** `app/readings/IntroOverlay.tsx:11-24`, `app/readings/layout.tsx:19`

`IntroOverlay` starts with `showIntro = false`, sets it to `true` in a
`useEffect` when `hasIntroPlayed()` is false, and **never sets it back to
`false`**. There is no timer, no unmount path, and no `markIntroPlayed()`
call. It renders `fixed inset-0 z-50`, so it swallows every tap on the page.

The `sessionStorage.velora_intro_played` flag it waits on is only ever written
by `components/brand/IntroAnimation.tsx`, which is mounted solely on the
homepage `/`.

Result: any visitor who reaches a `/readings/*` route without first loading the
homepage — a deep link, a shared URL, a refresh, or in-app navigation that
skips `/` — gets a permanent black veil with a pulsing gold dot. The page
renders correctly underneath and simply cannot be operated.

Measured on a fresh browser context:

| Route | Blocking overlays | `velora_intro_played` |
| --- | --- | --- |
| `/readings` | 1 | `null` |
| `/readings/love` | 1 | `null` |
| `/readings/career` | 1 | `null` |
| `/readings/general` | 1 | `null` |
| `/readings/daily` | 1 | `null` |
| `/readings/history` | 1 | `null` |

Playwright output:

```
locator resolved to <button class="... min-h-[44px] touch-manipulation">Begin Reading</button>
attempting click action
  <div class="fixed inset-0 z-50 bg-deepnight flex items-center justify-center"> intercepts pointer events
Timeout 30000ms exceeded.
```

Both "Begin Reading" and "Change category" are affected. The screenshot shows
a blank black page with a single pulsing dot — it reads as broken, not loading.

**Causation proven.** Visit `/` first → `markIntroPlayed()` sets the flag →
the same route reports 0 overlays, "Begin Reading" becomes clickable, and the
full 3-card flow completes.

`/mini-app` is unaffected because it uses a different layout, which is exactly
why the happy path works and this hides so easily.

**Provenance:** pre-existing, introduced in `18f3df4` — not part of the current
change. Still a release blocker.

**Suggested fix:** give `IntroOverlay` a bounded lifetime (e.g. dismiss on an
animation completion callback) and call `markIntroPlayed()` when it hides, so
the veil cannot outlive the thing that is supposed to clear it. Failing that,
only mount it where the animation that dismisses it is also mounted.

---

### 2. CRITICAL — `<NavBar>` rendered twice on `/readings/[type]/*`

**Files:** `app/readings/layout.tsx:18`, `app/readings/[type]/layout.tsx:13`

Both layouts render `<NavBar />`. The nested `[type]` layout does not need to —
its parent already provides one.

Confirmed 2 `<nav>` elements in the DOM, and the nav label sequence appears
twice in `innerText`:

```
Velora | Home | Readings | Tarot | My Readings | About |
Velora | Home | Readings | Tarot | My Readings | About
```

Duplicate landmarks and duplicate links in the accessibility tree, and doubled
visual chrome.

**Suggested fix:** drop `<NavBar />` from `app/readings/[type]/layout.tsx`.
Keep the comment explaining why that file must stay a server component.

---

### 3. HIGH — overall reading double-frames every card and silently drops content

**File:** `utils/tarotReading.ts:172-203` (calls at 187-189, template 196-202)

`readingText(sc)` already returns the full `"<lead>: <base>"` string.
`firstSentence()` is then applied to that same string, so it keeps the lead-in
*plus only the first sentence of the base meaning*.

Real captured output:

> The current energy stands with Justice: **In your love life right now:**
> Honest and balanced partnership.

Two distinct defects:

1. **Doubled framing.** The lead-in is repeated verbatim after a colon that
   already separates the two halves. Cards 2 and 3 produce the same
   `... : Influencing your relationships: ...` shape.
2. **Silent content loss.** `"Truth strengthens love."` — the second sentence of
   Justice's upright love meaning — is discarded. Any card whose base meaning
   is more than one sentence loses the tail.

**Suggested fix:** pass the card meaning to the summariser rather than the
already-composed reading, or drop the lead-in from the overall narrative
entirely since the position and category are already stated in the surrounding
sentence. Whichever is chosen, the overall reading should not re-derive
sentences that the per-card reading already shows in full.

---

### 4. HIGH — "CARD n" status text renders on top of the deck

**File:** `components/tarot/MiniAppDrawing.tsx:189-202` (consumed at 610-634)

```ts
const lowest = height / 2 + droop / 2 + halfH;
const clamped = Math.min(lowest + 36, height - 30);
```

`lowest` is a theoretical figure derived from the dome geometry, and the
`+36` offset is smaller than the discrepancy with the cards' real rendered
extent. The status block is `z-30`, above the deck's `z-10`, so it paints over
the card faces.

Measured at 390 × 844:

```
status block : y 613 – 667
deck (7 cards): y 257 – 660
                 ^^^^^^^^ 47px overlap
```

Clearly visible in the screenshot: "CARD 1 · CURRENT ENERGY" and "Choose the
card that draws your attention." are drawn across the card art.

**Suggested fix:** position the status block from the real measured bounding
box of the rendered deck rather than from the computed dome constants, and
clamp it so it cannot enter the deck's rect. Related: see #12.

---

### 5. HIGH — `/` overflows horizontally at every mobile width

**File:** `components/PhoneFrame.tsx:56-62`

The ambient glow div uses `style={{ inset: -40 }}` inside a `relative` parent
that has no `overflow-hidden`, so the glow bleeds 40px past each side of the
device and widens the document.

```
<PhoneFrame>  →  <div class="absolute rounded-[3.5rem] opacity-40 blur-2xl"
                       style="inset: -40px" />   bounding: left −24, right 414
```

Measured `scrollWidth` vs `clientWidth`:

| Viewport | `/` | `/mini-app` | `/readings/love` | `/explorer` | `/readings/history` |
| --- | --- | --- | --- | --- | --- |
| 320 | **+24** | ok | ok | ok | ok |
| 360 | **+24** | ok | ok | ok | ok |
| 375 | **+24** | ok | ok | ok | ok |
| 390 | **+24** | ok | ok | ok | ok |
| 412 | **+24** | ok | ok | ok | ok |
| 768 | ok | ok | ok | ok | ok |

Breaks the `AGENTS.md` checklist item "No horizontal scrolling on 360px
screens". Only the homepage is affected, because only the homepage mounts
`PhoneFrame`.

**Provenance:** pre-existing, from `1952daa`.

**Suggested fix:** add `overflow-hidden` to the glow's wrapper, or give the
glow wrapper `pointer-events-none` plus a clip. Note that clipping the glow
will also clip the `box-shadow` bezel ring on the device body at line 72, so
the clip has to sit above the glow and below the bezel.

---

### 6. MEDIUM — outer deck cards expose only ~18–26 px of tappable area

**File:** `components/tarot/MiniAppDrawing.tsx:26, 46, 119-161`

With `NUM_VISIBLE = 7` spread across `DOME_HALF_ANGLE = 45°`, the outer cards
are almost entirely buried by their neighbours. Measured exposed sliver of the
outermost cards at 390px:

```
exposedLeft: 18–19px      exposedRight: 25–26px
```

Breaks the `AGENTS.md` "touch targets ≥ 44px" rule. The two outermost cards
are effectively unselectable by thumb, which undermines the point of the dome
change ("so every card is choosable").

**Suggested fix:** reduce the fan angle, drop `NUM_VISIBLE` to 5, or increase
the card count while narrowing the spread. Verify with a real thumb-reach
measurement, not just bounding boxes, since the *exposed* region is what
matters on touch.

---

### 7. MEDIUM — Major Arcana prints the card number twice

**File:** `components/tarot/CardFront.tsx:48` and `:88-90`

```tsx
{arcana === "major" ? `${String(number).padStart(2, "0")}` : `${suit}…`}   // top-left
…
{String(number).padStart(2, "0")}                                          // bottom-right
```

For Major Arcana both corners render the same value. Visible on the result
screen: Strength shows `08` top-left *and* `08` bottom-right. Minor Arcana is
correct (suit name top-left, number bottom-right).

**Suggested fix:** for majors, render something else in the top-left — the
Roman numeral, or the arcana label — so the two corners carry different
information.

---

### 8. MEDIUM — `public/` is missing; 5 asset 404s, 4 of them on every page

`public/` **does not exist in the working tree** and `git ls-files public` is
empty, yet it is referenced from two places. Confirmed status codes:

| Path | Referenced from | Status |
| --- | --- | --- |
| `/favicon.ico` | `app/layout.tsx:25` | **404** |
| `/icons/favicon-32x32.png` | `app/layout.tsx:26` | **404** |
| `/icons/favicon-16x16.png` | `app/layout.tsx:27` | **404** |
| `/icons/apple-touch-icon.png` | `app/layout.tsx:30` | **404** |
| `/cards/back.jpg` | `app/page.tsx:106-107` | **404** |
| `/icon.svg` | `app/icon.svg` | 200 |

`/cards/back.jpg` has an `onError` fallback that hides the `<img>`, so the
homepage degrades gracefully. The four icon paths have no fallback and are
requested on every page load.

Note: `AGENTS.md` and `test.md` both document `public/` as containing
`favicon.ico`, `icons/`, and `cards/`. The directory is missing from the tree,
not from the documentation.

**Suggested fix:** restore `public/` from version history or the deployment
artefacts, or drop the metadata icon entries and the homepage `<img>` so the
code stops referencing assets that do not exist. Also resolves the
`@next/next/no-img-element` build warning.

---

### 9. MEDIUM — spread slot captions wrap and go ragged

**File:** `components/tarot/MiniAppDrawing.tsx:602-604`

```tsx
{p.label.split(" /")[0]}
```

Produces `"Current Energy"`, which wraps to two lines inside the 64px slot,
while `"Influence"` and `"Guidance"` fit on one. The three captions end up at
different baselines, which makes the slot row look misaligned. Visible in the
drawing-screen screenshot.

**Suggested fix:** give the caption a fixed height with `truncate`, or shorten
the labels in `TAROT_POSITIONS` for the slot row only (e.g. keep the full label
for the status line and use a separate `shortLabel` for the caption).

---

### 10. MEDIUM — `app/readings/daily/page.tsx` shadows `[type]` for the `daily` segment

**Files:** `app/readings/daily/page.tsx:1-7`, `app/readings/[type]/page.tsx:11-15`

`app/readings/daily/page.tsx` is a static page rendering
`<MiniAppDrawing />` with no `initialCategory`, so `/readings/daily` opens the
category picker. Because a static segment wins over a dynamic sibling, the
`daily` entry in `TYPE_TO_CATEGORY` is unreachable dead code.

Verified landing behaviour:

| Route | Lands on | `h2` |
| --- | --- | --- |
| `/readings/love` | intro screen | `Love` |
| `/readings/career` | intro screen | `Business` |
| `/readings/daily` | **category picker** | — |
| `/readings/general` | **category picker** | — |

So two of the four legacy reading types no longer deep-link to anything
category-specific, and the routing map advertises a mapping that can never
fire.

**Suggested fix:** decide whether `/readings/daily` is still a supported entry
point. If yes, give it an `initialCategory`; if no, delete it and remove the
dead `daily` entry from `TYPE_TO_CATEGORY` so the map tells the truth.

---

### 11. MEDIUM — saved-reading detail page contradicts the Mini App result

**Files:** `components/tarot/MiniAppDrawing.tsx:320-321`,
`app/readings/[type]/[id]/ReadingDetail.tsx:117, 189`

`MiniAppDrawing` hardcodes the saved reading type:

```ts
readingType: "general",
category: categoryMeta?.label ?? "General",
```

Consequences on the detail page:

- Line 117 renders `getReadingTypeLabel(cards.readingType)` → every
  category reading is headed **"GENERAL"**, including Health, Wealth, Travel,
  Business and Love. The category is only surfaced in the share text and one
  sentence of the summary.
- Line 189 calls
  `getCardInterpretation(cardData, orientation, cards.readingType)` with
  `"general"`, so the detail page shows **generic** meanings for cards the
  visitor just read category-specific meanings for. A Love reading that
  correctly showed `loveUpright` on the result screen reverts to
  `generalUpright` on its own detail page.

The category is stored correctly in localStorage (`"category":"Health"`), so
the data is available — only the detail page ignores it.

**Suggested fix:** store the category id on the saved reading and have
`ReadingDetail` route its interpretation through
`getCategoryCardReading` using the saved position labels, rather than through
`getCardInterpretation` keyed on `readingType`.

---

### 12. LOW — `statusTextTop` mixes CSS units and goes stale on resize

**File:** `components/tarot/MiniAppDrawing.tsx:189-202`

Returns `"calc(50% + 160px)"` when the deck is empty and a plain px string
otherwise. Two units for one property invites drift.

It is also a `useMemo` over `[visibleCardIds, getContainerSize]`, and
`getContainerSize` reads `containerRef.current.offsetWidth` at render time.
The `ResizeObserver` effect (lines 366-390) recomputes `positions` on resize
but has no path to recompute `statusTextTop`, so after a viewport resize or
orientation change the status text keeps its stale offset.

Fixing #4 properly by measuring the deck rect removes both problems.

---

### 13. LOW — leaked `setTimeout` handles in the category picker

**File:** `components/tarot/MiniAppDrawing.tsx:486-489`

```tsx
onClick={() => {
  setCategory(c.id);
  timerRef.current = window.setTimeout(() => setPhase("intro"), 450);
}}
```

`timerRef.current` is overwritten on each click, so tapping two categories
quickly orphans the first timer. The orphan still fires `setPhase("intro")`,
which happens to be harmless here, and the unmount cleanup (lines 358-363) can
only clear the last handle. Low impact, but it is the same handle used for the
shuffle/reveal/place sequence, so it is worth clearing before reassigning.

---

## 4. What passes

Verified working, so the fixes above do not regress it:

- **Full flow** works end to end on `/mini-app` for all 5 categories:
  category → confirmation → shuffle → 3 draws → reveal → place → result →
  Draw Again → Change Category.
- **Spread rules hold.** No duplicate cards within a spread, and no card
  repeated from the immediately previous spread, across 8 consecutive
  Draw Again cycles. `pickVisibleIds` (lines 205-216) correctly excludes both
  the in-progress spread and `lastSpreadIds`, and the degenerate-case guard
  behaves.
- **Persistence is correct.** `velora_readings` is written with the right
  shape — position labels, card ids, orientations, and the category label.
- **The history list renders category correctly** — verified showing
  `Health` for a Health reading.
- **`prefers-reduced-motion: reduce`** completes the full flow in 14.4s with
  zero errors. The reduced-duration branches are wired correctly.
- **Route 404s are correct.** `/readings/business` and `/readings/bogus` both
  return a real 404, so the `isReadingType` guard from `b1db8ad` holds.
- **No horizontal overflow** on `/mini-app`, `/readings/love`, `/explorer`, or
  `/readings/history` at any tested width.
- **Zero uncaught exceptions or console errors** across every flow tested. The
  only console noise is the asset 404s from #8.

---

## 5. Test coverage gap

There is no automated test infrastructure at all:

- No `test` script in `package.json`
- No test runner installed (no jest / vitest / playwright / cypress /
  @testing-library in `node_modules`)
- No `*.test.*` or `*.spec.*` files anywhere in the repo
- `.gitignore` excludes `/tests/` and `/__tests__/`, so tests cannot be added
  at those conventional paths without a `.gitignore` change

This is why findings #1, #4, #5, #6 and #11 all survived three passing CI
gates. Each one is a pure function of a state transition or a layout
measurement, and each is cheap to pin down:

- `composeOverallReading` and `firstSentence` — pure functions over the
  existing card data, no DOM required
- `pickVisibleIds` spread-uniqueness — pure, no DOM required
- `IntroOverlay` dismissal — one component test with a fake timer
- Deck/status geometry — one layout test at 360px, 390px and 412px

The `AGENTS.md` validation checklist has 13 unticked boxes, several of which
this pass just turned into confirmed failures (#5 horizontal scroll, #6 touch
targets, #8 asset loading).

---

## 6. Suggested fix order

1. **#1** blocking overlay — the whole `/readings/*` surface is inoperable
2. **#2** duplicate nav — one-line removal, same files as #1
3. **#5** homepage overflow — one `overflow-hidden`, breaks a documented
   acceptance criterion
4. **#4 + #12** status text overlap — same code, fix together
5. **#3** overall reading — pure function, isolated, high user impact
6. **#11** detail page category loss — silent data inconsistency
7. **#8** missing `public/` — decide restore-vs-remove
8. **#10** dead `daily` route — small routing decision
9. **#6** touch targets — needs a real design decision on the dome
10. **#7, #9, #13** — cosmetic and cleanup

Then add the test coverage from §5 before the next change lands, so this class
of defect is caught by a gate rather than by inspection.
