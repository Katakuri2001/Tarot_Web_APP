import Link from "next/link";
import Stars from "@/components/Stars";
import NavBar from "@/components/NavBar";

/**
 * Server component.
 *
 * This must not be a client component: when app/readings/[type]/page.tsx calls
 * notFound() for an unknown reading type, a client-rendered not-found boundary
 * swallows the 404 and the route responds 200 with a loading shell instead of
 * a real 404 status.
 */
export default function NotFound() {
  return (
    <>
      <Stars />
      <NavBar />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-gold-400/20 flex items-center justify-center">
            <span className="text-gold-300 text-3xl font-serif-display">?</span>
          </div>
          <h1
            className="font-serif-display text-4xl text-warmwhite mb-4"
            style={{ fontWeight: 300 }}
          >
            Lost in the Cards
          </h1>
          <p className="text-moonlight mb-8">
            This path isn&apos;t part of your journey yet. Let&apos;s find your way back.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-full bg-gold-400 text-midnight font-medium tracking-wider text-sm hover:bg-gold-300 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </main>
    </>
  );
}
