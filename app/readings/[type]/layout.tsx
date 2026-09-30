import NavBar from "@/components/NavBar";

/**
 * Server component. It must not wrap `children` in a Suspense boundary:
 * a client-side boundary here swallows the `notFound()` signal thrown by
 * app/readings/[type]/page.tsx, so an unknown reading type renders the loading
 * fallback with a 200 instead of a real 404. The reading experience provides
 * its own Suspense boundary in ReadingClient.tsx.
 */
export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
