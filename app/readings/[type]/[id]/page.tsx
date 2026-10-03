import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import ReadingDetail from "./ReadingDetail";

interface Props {
  params: { type?: string; id?: string };
}

/**
 * Two id shapes have ever been written to localStorage, so both are accepted:
 *
 * - `1760000000000-a1b2c3` — `${Date.now()}-${Math.random().toString(36)...}`,
 *   the only format the Mini App actually writes (and the only one git history
 *   has ever contained).
 * - `reading_1760000000000_a1b2c3` — `generateReadingId()` from tarotUtils.
 *
 * The base-36 suffix is `*` rather than `+` on purpose: `Math.random().toString(36)`
 * can yield a string too short to leave anything after `substring(2, ...)`, and a
 * 404 for a real saved reading would be far worse than a 200 for an empty one.
 */
const READING_ID_PATTERN = /^(?:\d+-[0-9a-z]*|reading_\d+_[0-9a-z]*)$/i;

/**
 * Server component for a single saved reading.
 *
 * Whether an id is *real* cannot be checked here — saved readings live in the
 * visitor's localStorage, not in a server-side store, so two browsers can hold
 * different readings under the same URL. What can be checked is whether the id
 * is even shaped like one this app produces: a malformed id, an unknown reading
 * type, or a missing id are all bad URLs regardless of storage, so those return
 * a real 404 instead of a 200 that renders a "reading not found" message.
 *
 * The id itself is resolved in ReadingDetail, in the browser.
 */
export default function ReadingResultPage({ params }: Props) {
  const { type, id } = params;

  if (!isReadingType(type) || !id || !READING_ID_PATTERN.test(id)) {
    notFound();
  }

  return <ReadingDetail id={id} readingType={type} />;
}
