import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import ReadingDetail from "./ReadingDetail";

interface Props {
  params: { type?: string; id?: string };
}

/**
 * Server component for a single saved reading.
 *
 * The reading id cannot be validated here — saved readings live in the
 * visitor's localStorage, not in a server-side store, so the server has no way
 * to know whether an id is real. What *can* be validated is the route shape:
 * an unknown reading type or a missing id is a bad URL no matter what, so those
 * return a real 404 instead of a 200 that renders a "reading not found"
 * message.
 *
 * The id itself is resolved in ReadingDetail, in the browser.
 */
export default function ReadingResultPage({ params }: Props) {
  const { type, id } = params;

  if (!isReadingType(type) || !id) {
    notFound();
  }

  return <ReadingDetail id={id} readingType={type} />;
}
