import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { SoundToggle } from "@/components/reading/SoundToggle";
import { useReducedMotion } from "@/hooks/useShared";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/readings", label: "Readings" },
  { href: "/explorer", label: "Tarot" },
  { href: "/readings/history", label: "My Readings" },
  { href: "/about", label: "About" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40" role="navigation" aria-label="Main navigation">
      <div className="glass-dark px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Velora Home">
          <Logo size="compact" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wider transition-colors ${
                pathname === link.href
                  ? "text-gold-300"
                  : "text-moonlight hover:text-gold-300"
              }`}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <SoundToggle />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-warmwhite p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden glass-dark border-t border-gold-400/10 overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wider transition-colors ${
                pathname === link.href ? "text-gold-300" : "text-moonlight"
              }`}
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <SoundToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
