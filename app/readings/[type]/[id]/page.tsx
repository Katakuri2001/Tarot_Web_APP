import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import ReadingDetail from "./ReadingDetail";

interface Props {
  params: { type?: string; id?: string };
}

/**
 * Server component for a single saved reading.
 *
 * The reading *existence* cannot be validated here — saved readings live in
 * the visitor's localStorage, not in a server-side store, so the server has no
 * way to know whether an id is real. An unknown but well-formed id therefore
 * renders the "reading not found" state with a 200.
 *
 * The id's *shape*, however, is knowable: ids are always opaque alphanumeric
 * tokens generated in the browser. Anything carrying a slash, a dot, a space
 * or other punctuation is a malformed URL rather than a real id — those are a
 * bad URL no matter what, so they return a real 404 instead of a 200, which
 * would waste a render and invite crawlers to index junk.
 *
 * The id itself is resolved in ReadingDetail, in the browser.
 */
const READING_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,39}$/;

export default function ReadingResultPage({ params }: Props) {
  const { type, id } = params;

  if (!isReadingType(type) || !id || !READING_ID_PATTERN.test(id)) {
    notFound();
  }

  return <ReadingDetail id={id} readingType={type} />;
}
