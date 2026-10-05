/**
 * Server component. It must not wrap `children` in a Suspense boundary:
 * a client-side boundary here swallows the `notFound()` signal thrown by
 * app/readings/[type]/page.tsx, so an unknown reading type renders the loading
 * fallback with a 200 instead of a real 404. The reading experience provides
 * its own Suspense boundary in ReadingClient.tsx.
 *
 * Navigation is deliberately absent: app/readings/layout.tsx is the single
 * provider for the whole subtree. Rendering it here as well shipped two
 * navigation landmarks and two copies of every nav link.
 */
export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
