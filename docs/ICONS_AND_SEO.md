# Icons, Favicons and Social Metadata

**Status:** Icon coverage **done**. Domain-dependent and SEO work **deferred**.
**Date raised:** 2026-10-06
**Raised while:** inspecting bug #8 (`public/ missing) at the end of the
14-bug fix pass.

## 0. Outcome summary

Decisions taken by the project owner, 2026-10-06:

| Question | Decision |
| --- | --- |
| Brand assets | Use the current assets; real brand artwork to be added later |
| Production origin | Cloudflare Workers/Pages for now; domain added when needed |
| Robots / sitemap | Not wanted for now |

What was implemented from that:

- `app/apple-icon.png` — 180×180, generated from `app/icon.svg`. Restores the
  iOS home-screen icon, which iOS does not honour from SVG.
- `app/favicon.ico` — 16/32/48px, generated from `app/icon.svg`. Covers the bare
  `/favicon.ico` probe that some clients and crawlers issue.
- `app/apple-touch-icon.svg` — **deleted.** Next's convention is `apple-icon.*`,
  so this file was never served; it was a byte-identical duplicate of
  `app/icon.svg` that only produced a 404.
- `scripts/generate-icons.mjs` — regenerates the two rasters from the SVG.

What was deliberately **not** done:

- **No `metadataBase`.** There is no production origin yet, and a placeholder
  would be worse than nothing: wrong absolute URLs get baked into every social
  share and every sitemap entry, and crawlers index them. See §4.4 — this must
  be set *before* an OG image is added, or previews silently render blank.
- **No `robots.txt`, no `sitemap.xml`.**
- **No OG / twitter image**, so `twitter: card: "summary_large_image"` in
  `app/layout.tsx` still claims a large image that does not exist. Left as-is:
  changing the card type alters how shares appear, which is a product decision,
  and there is no image to add yet.

Verified served after the change:

```
<link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16"/>
<link rel="icon" href="/icon.svg?…" type="image/svg+xml" sizes="any"/>
<link rel="apple-touch-icon" href="/apple-icon.png?…" type="image/png" sizes="180x180"/>
```

Note that Next emits `sizes="16x16"` for the `.ico` even though the container
holds 16/32/48. Browsers pick the appropriate entry regardless; the attribute
is Next's, not ours.

### Known cosmetic limit at 16px

Measured, not assumed. `app/icon.svg` is three shapes on a 32×32 viewBox. At
32px and above the crescent and dot read cleanly. At **16px the crescent thins
to a sliver and the cream dot merges into its inner edge**, reading as a nick in
the crescent rather than a separate star.

Left unchanged because the instruction was to use the current assets. Fixing it
means editing the source SVG's circle coordinates — a branding change. The 16px
entry is kept because omitting it makes small-context rendering worse, not
better.

---

## 1. Why this doc exists

Bug #8 was reported as "missing `public/` directory, five asset 404s". That
report turned out to be **partly wrong**, and fixing it surfaced a *different*
set of gaps that nobody has asked for yet. This doc parks those so the finding
is not lost, and records why nothing was changed.

Nothing here is a regression. Every item below predates the category-first
Mini App work and was introduced by the original V1 commit.

---

## 2. Provenance — none of this is from the recent work

| Item | Introduced by |
| --- | --- |
| `twitter: card: "summary_large_image"` | `8e5f229` — "Velora Tarot V1", 2026-09-18, Katakuri2001 |
| `app/apple-touch-icon.svg` | `8e5f229`, same commit |
| `app/icon.svg` | `8e5f229`, same commit |
| `icons:` metadata block (`/favicon.ico`, `/icons/*.png`) | `8e5f229`, same commit |
| `metadataBase` never set | never, in any commit |
| No `noindex` anywhere in the app | never, in any commit |

The only metadata change made during the 14-bug fix pass was **removing** the
broken `icons:` block from `app/layout.tsx`. No `.svg` file was touched, and no
`twitter.*` or `metadataBase` value was added.

`public/` was never tracked in this repository at all:

```
git log --all --diff-filter=A -- 'public/*'          → empty
git rev-list --all --objects | grep ' public/'      → 0 objects
```

So the assets cannot be restored from git history. If they exist, they are in a
deployment artefact or an external design source.

---

## 3. Verified current state

Measured against a production build (`npm run build && npm run start`), not
inferred from source.

### URLs

| URL | Status | Notes |
| --- | --- | --- |
| `/icon.svg` | **200** | Working. Next serves it from `app/icon.svg` |
| `/apple-touch-icon.svg` | **404** | Dead file, see §4 |
| `/apple-icon.*` | — | Never emitted |
| `/favicon.ico` | **404** | Legacy auto-probe fails |
| `/manifest.json` | **404** | Absent |
| `/robots.txt` | **404** | Absent |
| `/sitemap.xml` | **404** | Absent |
| og:image / twitter:image | **absent** | No file in `app/` |

### Served `<head>` — the complete icon situation

The only icon-related tag Next emits is:

```html
<link rel="icon" href="/icon.svg?1fbc71bde57e90f8" type="image/svg+xml" sizes="any"/>
```

No `apple-touch-icon`, no manifest, no `robots`.

---

## 4. Findings

### 4.1 `app/apple-touch-icon.svg` is inert

Next's file-based metadata convention is **`apple-icon.*`**, not
`apple-touch-icon.*`. The file therefore does nothing:

- It is not picked up as metadata.
- It is not served at any route (404).
- It is byte-identical to `app/icon.svg` (identical md5:
  `fac97e7b3ebd7f5da8303bcf061d3195`).

**Safe to delete under every option below.**

### 4.2 No iOS home-screen icon

Because nothing is emitted for `apple-touch-icon`, "Add to Home Screen" on iOS
falls back to a screenshot of the page. Note that iOS does not reliably honour
SVG for this purpose, so a **PNG** is required to actually fix it.

This matters more than usual for this product: it is built as a Mini App
targeting mobile WebViews.

### 4.3 `twitter: card = "summary_large_image"` with no image

`app/layout.tsx` declares a large-image card but no image file exists. A card
type without an image is a claim the markup cannot back up.

### 4.4 `metadataBase` is not set

**Nothing is broken by this today**, because there is no image to resolve. It
becomes a real failure the moment an OG image is added: Next will emit a
*relative* `og:image`, and Facebook, X, LinkedIn, Slack, WhatsApp and Discord
all require *absolute* URLs for previews. A relative URL yields **no preview,
silently**.

So the order matters: `metadataBase` must be set **before** adding an OG image.

### 4.5 Nothing is marked `noindex`, and a dynamic route is a crawler dead end

`/readings/[type]/[id]` resolves a saved reading from the **visitor's
localStorage**. A crawler has no localStorage, so every such URL renders
*"Reading not found."* With no `robots.txt` and no `noindex`, search engines are
free to index a wall of dead-end pages.

This is the strongest argument for adding `robots.txt`.

---

## 5. Options for the icons

### Option A — code only, no new binary files

- Delete `app/apple-touch-icon.svg`. Add nothing.
- Result: tab icon works in modern browsers. iOS home screen still screenshots
  the page. `/favicon.ico` still 404s.
- Risk: essentially zero.
- Still missing: iOS home-screen icon, legacy favicon probe.

### Option B — generate raster icons from the existing SVG — **CHOSEN**

- Keep `app/icon.svg` as the source of truth.
- Add `app/apple-icon.png` at 180×180 so Next emits
  `<link rel="apple-touch-icon">`.
- Add `app/favicon.ico` (16/32/48) for the legacy probe.

Implemented. Regenerate with `node scripts/generate-icons.mjs`.

**Legibility was measured, not assumed.** `app/icon.svg` is three shapes on a
32×32 viewBox (dark rounded square, gold crescent, cream dot), rasterised with
`sharp` at 16/32/48/180:

| Size | Result |
| --- | --- |
| 180px | Clean. Crescent and dot read well |
| 48px | Clean |
| 32px | Legible |
| 16px | **Crude.** Crescent thins to a sliver and the dot merges into the crescent's inner edge, reading as a bump rather than a separate star |

So Option B is viable, but 16px needs a deliberate decision: either adjust the
circle's coordinates in the source SVG, or ship only 32/48 in the `.ico` and
let the SVG cover modern browsers.

**Caveat:** `sharp` is currently only a *transitive* dependency (pulled in by
Next). A committed generation script would not be reproducible for other
contributors unless `sharp` is declared in `devDependencies`.

### Option C — restore the real brand assets

- Copy in the actual `favicon.ico` / PNGs from a deployment artefact or design
  source.
- Result: the intended artwork, correct at every size.
- Risk: zero, if the files exist. Blocked otherwise — brand binaries cannot be
  faithfully recreated by hand.

**Recommendation:** C if the assets exist anywhere, otherwise B. Option A leaves
a visible gap on the platform this product targets most.

---

## 6. Open decisions — remaining

The three questions in §0 are answered. These are what remains, all of them
blocked on the production origin.

1. **What is the production origin?** Needed for `metadataBase`, any
   `robots.txt` sitemap reference, sitemap entries, and OG image URLs. It is
   **not** discoverable from the repo: not in `wrangler.toml` (which carries
   only worker *names*, `velora-tarot` and `velora-tarot-admin`), not in
   `package.json`, not in the README. The CORS middleware reflects `url.origin`
   straight back, so it pins nothing. A Cloudflare custom domain or
   `*.workers.dev` subdomain lives in the Cloudflare dashboard.
2. **Add real brand artwork** — replace `app/icon.svg` and re-run
   `node scripts/generate-icons.mjs`. This is also the fix for the 16px limit in
   §0, if the new artwork suits small sizes better.
3. **Add an OG / twitter image** — only *after* `metadataBase` exists. Requires
   deciding whether to keep `summary_large_image` or drop to `summary`.
4. **Robots / sitemap** — currently unwanted. If revisited, robots is the one
   with real value: `/readings/[type]/[id]` is a crawler dead end (§4.5).

**When the domain is known:** set `metadataBase` first, then add images. If an
env var is preferred over hardcoding, use `NEXT_PUBLIC_SITE_URL` **and** add a
build-time warning when it is missing in production — a silent fallback to
`localhost` would bake wrong URLs into shares, which is the failure mode this
section exists to prevent.

---

## 7. Safety rules for whoever picks this up

- Never invent brand artwork. Generate from `app/icon.svg` (defensible, it is
  the source) or restore the real files. Do not hand-draw a replacement.
- Set `metadataBase` **before** adding an OG image, or social previews will
  silently render blank.
- Verify every added asset is actually served `200`, not merely present on disk.
- Verify rasterised icons **visually at their real size**. 16px is where this
  artwork degrades.
- Keep `app/icon.svg` as the regeneration source of truth.
- Do not let an icon fix become a branding redesign.
- Keep `app/icon.svg` as the only icon Next picks up unless a PNG is genuinely
  needed — two icon files in `app/` means two emitted `<link rel="icon">` tags.

---

## 8. Related, not part of this task

- **`/admin`** is described in `AGENTS.md` as a separate build. If it deploys
  to a different host or subdomain, a `robots.txt` on the main site does
  nothing for it — it needs one at its own origin. It does have JWT middleware,
  so `noindex` there is defence in depth, not the primary control.
- **`test.md`** (dated 2026-09-20, predates the category rewrite) still
  documents a `public/` directory with `favicon.ico`, `icons/` and `cards/`
  at line 578, and at line 347 prescribes creating `public/robots.txt`. Both
  are stale in light of §2.
- **`AGENTS.md`** has been corrected to state that `public/` does not exist.

---

## 9. Also parked (from the 14-bug fix pass)

Unrelated to icons, listed here so it is not lost:

| Item | Note |
| --- | --- |
| 320px deck | Five cards cannot each reach 44px at that width. Needs four candidates, not smaller cards. Recorded in `NUM_VISIBLE` in `components/tarot/MiniAppDrawing.tsx` |
| "Daily Reading — one card" copy | `/readings` and the homepage describe a 1-card reading; the category flow always draws three. Product copy |
| Bug #13 has no test | Impact was latent, not visible. A DOM test harness was not worth the dependency |
| Landscape layout | Out of scope: `AGENTS.md` states the Mini App is portrait only |

See `docs/BUG_REPORT.md` §6 "Not addressed" for the full list.

---

## 10. Tech stack at time of writing

Recorded so this doc can be read without cross-referencing `package.json`, and
so future changes can tell whether the guidance above still applies.

| Layer | Choice | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 14.2.5 |
| Language | TypeScript (strict) | 5.6.3 |
| Runtime | Node | 24.11.1 |
| Package manager | npm | 11.6.2 |
| Styling | Tailwind CSS + CSS custom properties | 3.4.15 |
| Animation | Framer Motion (only animation library) | 11.11.17 |
| Icons (UI) | lucide-react | 0.460.0 |
| Class merging | clsx + tailwind-merge | 2.1.1 / 2.5.4 |
| State | React `useState`/`useEffect` — no external store | 18.3.1 |
| Deployment | OpenNext → Cloudflare Workers | @opennextjs/cloudflare 1.0.1 |
| Edge runtime | Cloudflare Workers (wrangler) | 4.134.0 |
| Database | Cloudflare D1 (SQLite) | — |
| Object storage | Cloudflare R2 | — |
| Admin auth | JWT + bcryptjs | — |
| Unit tests | vitest (node env) | 5.0.3 |
| Browser tests | @playwright/test (chromium) | 1.63.0 |
| Lint | ESLint + `next/core-web-vitals` | 8.57.0 |
| Types | @cloudflare/workers-types | 5.20260917.1 |

**Fonts:** Cormorant Garamond (serif display), DM Sans (sans body), loaded in
`app/layout.tsx`. This is what triggers the `no-page-custom-font` lint warning —
a Pages-Router rule applied to an App Router app.

**Test split:** `tests/unit` (vitest, node) covers pure logic; `tests/e2e`
(Playwright, chromium, 390×844 mobile) covers layout, hit-testing, sessionStorage,
routing and assets. `npm run test` runs both. `test:e2e` builds for production
on port 3210 and wipes `.next` first — see `playwright.config.ts` for why.

**Note for anyone extending this work:** `vite@8.3.0` and `@vitejs/plugin-react`
are already installed but were not used by the app itself; vitest reuses the
same vite. `sharp` is available only transitively via Next — see the caveat in
§5.