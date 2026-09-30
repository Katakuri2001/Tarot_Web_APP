import { notFound } from "next/navigation";
import { isReadingType } from "@/lib/tarot-engine";
import ReadingClient from "./ReadingClient";

interface Props {
  params: { type?: string };
}

/**
 * Server component: validates the route segment before rendering, so an
 * unknown reading type returns a real 404 instead of silently falling back to
 * a default reading. The drawing experience itself is client-side.
 */
export default async function MiniAppReadingPage({ params }: Props) {
  // Await params so the segment is resolved and the notFound() check runs
  // before any part of the response is streamed, so the status code can still
  // be set to 404.
  const { type } = await params;

  if (!isReadingType(type)) {
    notFound();
  }

  return <ReadingClient type={type} />;
}
