import Stars from "@/components/Stars";
import NavBar from "@/components/NavBar";
import IntroOverlay from "./IntroOverlay";

/**
 * Server component.
 *
 * This must stay a server component: app/readings/[type]/page.tsx calls
 * notFound() for an unknown reading type, and a "use client" parent here
 * prevents that 404 from propagating — the error gets swallowed and the
 * route serves the loading fallback with a 200 instead. Client-only pieces
 * (intro overlay, navigation) live in their own client components.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stars />
      <NavBar />
      <IntroOverlay />
      <main className="relative z-10">{children}</main>
    </>
  );
}
