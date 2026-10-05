import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import type { TarotCategory, ReadingType } from "@/data/types";
import ReadingClient from "./ReadingClient";

interface Props {
  params: { type?: string };
}

/**
 * Legacy reading-type deep links, mapped onto the category-first flow.
 *
 * Only the types with a direct category equivalent are listed. `daily` and
 * `general` have no counterpart — they open on the category picker — and are
 * deliberately absent rather than mapped to `undefined`, so this map states
 * what it actually does instead of implying a mapping it does not perform.
 *
 * Nothing else may define an app/readings/<type>/page.tsx: a static segment
 * takes precedence over this dynamic one, which silently bypassed the mapping
 * below and stranded the corresponding entry here as dead code.
 */
const TYPE_TO_CATEGORY: Partial<Record<ReadingType, TarotCategory>> = {
  love: "love",
  career: "business",
};

export default async function MiniAppReadingPage({ params }: Props) {
  const { type } = await params;

  if (!isReadingType(type)) {
    notFound();
  }

  return <ReadingClient initialCategory={TYPE_TO_CATEGORY[type]} />;
}
