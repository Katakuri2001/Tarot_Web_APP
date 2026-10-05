import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import type { TarotCategory } from "@/data/types";
import ReadingClient from "./ReadingClient";

interface Props {
  params: { type?: string };
}

/** Map legacy reading-type deep links onto the category-first flow. */
const TYPE_TO_CATEGORY: Record<string, TarotCategory | undefined> = {
  love: "love",
  career: "business",
  daily: undefined,
  general: undefined,
};

export default async function MiniAppReadingPage({ params }: Props) {
  const { type } = await params;

  if (!isReadingType(type)) {
    notFound();
  }

  return <ReadingClient initialCategory={TYPE_TO_CATEGORY[type]} />;
}
