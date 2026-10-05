import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CardFront from "@/components/tarot/CardFront";
import { getCardById } from "@/utils/tarotUtils";

/**
 * Regression: bug #7 (MEDIUM) — Major Arcana printed the card number twice.
 *
 * CardFront renders the number in the top-left for majors
 * (`arcana === "major" ? padStart(number) : suitName`) and again in the
 * bottom-right unconditionally. So Strength showed "08" in both corners,
 * while minors correctly showed a suit name up top.
 *
 * Marking a component a "use client" boundary would not help here: it has no
 * state or effects, so rendering it to static markup exercises exactly the
 * same code path as the browser and keeps this in the fast node suite.
 */

function render(props: Partial<React.ComponentProps<typeof CardFront>> = {}) {
  const card = getCardById("strength")!; // Major Arcana, number 8
  return renderToStaticMarkup(
    <CardFront
      name={card.name}
      keywords={card.keywords}
      arcana={card.arcana}
      suit={card.suit}
      number={card.number}
      orientation="upright"
      {...props}
    />
  );
}

/** Text nodes only, so class names and attributes cannot create a false match. */
function textNodes(html: string): string[] {
  return Array.from(html.matchAll(/>([^<>]+)</g))
    .map((m) => m[1].trim())
    .filter(Boolean);
}

describe("CardFront", () => {
  it("shows a Major Arcana number exactly once", () => {
    const nodes = textNodes(render());

    // Strength is major arcana 8. The bottom-right corner carries "08"; the
    // top-left must carry something else, so "08" appears exactly once.
    expect(nodes.filter((t) => t === "08")).toHaveLength(1);
  });

  it("labels a Major Arcana card with its Roman numeral", () => {
    // Distinct from the Arabic number bottom-right, and conventional for tarot.
    expect(textNodes(render())).toContain("VIII");
  });

  it("falls back to a printable label for an out-of-range major", () => {
    // No Roman numeral exists for 99, so both corners legitimately show "99".
    // What matters is that the top-left degrades to something printable
    // instead of rendering "undefined" or an empty gap.
    const nodes = textNodes(render({ number: 99 }));
    expect(nodes.filter((t) => t === "99")).toHaveLength(2);
    expect(nodes).not.toContain("undefined");
    expect(nodes).not.toContain("");
  });

  it("does not repeat the number for a Minor Arcana card", () => {
    const pentacles = getCardById("seven-of-pentacles")!;
    const html = renderToStaticMarkup(
      <CardFront
        name={pentacles.name}
        keywords={pentacles.keywords}
        arcana={pentacles.arcana}
        suit={pentacles.suit}
        number={pentacles.number}
        orientation="upright"
      />
    );
    const nodes = textNodes(html);

    // Top-left is the suit name, bottom-right is the number: exactly one "07".
    expect(nodes).toContain("Pentacles");
    expect(nodes.filter((t) => t === "07")).toHaveLength(1);
  });

  it("keeps the card name upright and readable when reversed", () => {
    // The old implementation mirrored the whole card with scaleX(-1), which
    // made the name render backwards. Reversal must not mirror the text.
    const html = render({ orientation: "reversed" });
    expect(html).toContain("Strength");
    expect(html).not.toContain("scaleX(-1)");
  });

  it("marks a reversed card without mirroring the whole card", () => {
    const reversed = render({ orientation: "reversed" });
    const upright = render({ orientation: "upright" });

    // The only difference between the two states is the emblem rotation.
    expect(reversed).not.toBe(upright);
    expect(reversed).toContain("rotate(180deg)");
    expect(upright).not.toContain("rotate(180deg)");
  });

  it("exposes the card name as a heading", () => {
    expect(render()).toContain("<h3");
  });

  it("truncates long keyword lists rather than overflowing the card", () => {
    const html = render({ keywords: ["A very long keyword indeed", "Another long one", "Third"] });
    const nodes = textNodes(html);

    expect(nodes.some((t) => t.includes("•"))).toBe(true);
    expect(html).toContain("truncate");
  });
});