"use client";

import Navigation from "@/components/Navigation";

/**
 * Client boundary for the site Navigation, which relies on usePathname and
 * useState. Server components (such as the readings layout, which must stay a
 * server component so it does not swallow notFound()) cannot import it
 * directly.
 */
export default function NavBar() {
  return <Navigation />;
}
