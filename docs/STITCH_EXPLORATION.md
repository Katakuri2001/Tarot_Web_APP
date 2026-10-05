# Stitch Exploration — Tarot Mini App 3-Card Ritual

The Stitch MCP server requires OAuth2 credentials, which this environment does
not have (live `stitch_*` calls return HTTP 401: "API keys are not supported…").
Per the AGENTS.md rule that Stitch skills guide visual/interaction design, the
available skill files under `.opencode/skills/` were applied directly:
`generate-design` (prompt enhancement pipeline), `enhance-prompt`,
`manage-design-system`, `taste-design`, and `stitch-loop`.

The prompts below are the enhanced Stitch prompts that would be sent to
`generate_screen_from_text` once OAuth2 is configured. The implemented motion
choreography in `components/tarot/MiniAppDrawing.tsx` follows their structure.

## Design system tokens (would be applied via `create_design_system`)

- Background: near-black `#06060f` → cosmic indigo `#1a0a3e` radial
- Accent: antique gold `#d4b85a` (borders, glows, CTAs)
- Text: warm white `#f0ebe6`, moonlight `#c8c2d8`, muted `#5c5769`
- Display serif: Cormorant Garamond 300/400
- Body sans: DM Sans
- Shape: `rounded-xl` cards, pill buttons; whisper-soft gold glows
- Atmosphere: sparse stars, faint constellations, controlled radial light

## 12 required states (enhanced prompts)

1. **Category selection** — "Mobile-first dark tarot app screen. Headline 'What
   would you like to know?', subline 'Choose a path for your three-card
   reading.', vertical list of five elegant glass rows: Love ♡, Health ❧,
   Business ✦, Wealth ◈, Travel ✈. Gold hairline borders, soft glow on the
   pressed row. No dashboard-card clutter."
2. **Reading introduction** — "Centered confirmation: small 'YOUR READING'
   overline, category glyph, category name, one-line description, full-width
   gold pill CTA 'Begin Reading', text link 'Change category'."
3. **Card 1 selection** — "Tarot deck fanned in an elliptical dome, every card
   back visible and tappable, status line beneath reading 'CARD 1 · Current
   Energy — choose the card that draws your attention.'"
4. **Card 1 reveal** — "Selected card rises to center, scales up, others
   recede to black; card flips 180° on Y-axis with perspective; artwork
   materializes; 'Revealing…' caption."
5. **Card 2 selection** — "First revealed card shrunk into a small slotted
   indicator at top; fresh deck fan below; caption 'CARD 2 · Influence /
   Challenge'; progress dots ●○○."
6. **Card 2 reveal** — same choreography as state 4, caption updated.
7. **Card 3 selection** — two slotted cards at top, 'CARD 3 · Guidance /
   Direction — One final card.'
8. **Card 3 reveal** — same flip choreography.
9. **Final spread** — three fluid 2:3 cards in a row, names, orientation
   label, position caption under each.
10. **Individual reading** — scrollable stack of glass panels: overline
    '01 — Current Energy', card name, orientation pill, interpretation,
    keyword pills, italic advice line.
11. **Overall reading** — highlighted glass panel titled 'Overall Reading'
    with a unified paragraph; health safety disclaimer when applicable.
12. **Draw Again transition** — interpretation fades, three-card spread
    collapses back into the fanned deck, category chip persists in header,
    reshuffle, Card 1 prompt returns.

## Motion choreography decisions (from the skills' guidance)

- Idle deck: gentle elliptical dome fan, 7 visible cards, slow breathing glow.
- Shuffle: tick-driven cascade (hill of cards traveling top→bottom with
  eased phase easing, tiny x/rotate jitter), never random re-jumps.
- Touch: `whileTap` scale 0.95 + 44px+ tap targets, `touchAction: manipulation`.
- Selection: selected card springs to center at 1.12×, deck fades out.
- Place: hero card scales to slot geometry and hands off to the slot row
  (shared-center interpolation, not position teleport).
- All motion GPU-friendly: `transform` + `opacity` only; no blur filters on
  animated nodes; reduced-motion collapses to 0.3s transitions.
