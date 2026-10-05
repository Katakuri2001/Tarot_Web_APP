import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Velora — Discover What The Cards Reveal",
    template: "%s | Velora",
  },
  description: "Step into the mystical observatory of Velora. Trust your intuition. Let the tarot cards reveal another perspective on your journey.",
  openGraph: {
    title: "Velora — Discover What The Cards Reveal",
    description: "Step into the mystical observatory of Velora. Trust your intuition. Let the tarot cards reveal another perspective on your journey.",
    type: "website",
    locale: "en_US",
    siteName: "Velora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora — Discover What The Cards Reveal",
    description: "Step into the mystical observatory of Velora. Trust your intuition. Let the tarot cards reveal another perspective on your journey.",
  },
  /*
   * No explicit `icons` block. It used to point at /favicon.ico and four
   * /icons/*.png paths that have never existed in this repository, and
   * app/icon.svg takes precedence over the metadata field anyway — the served
   * HTML contained only <link rel="icon" href="/icon.svg">, so those entries
   * were inert configuration rather than the per-page 404s they were first
   * reported as. app/icon.svg is picked up automatically.
   */
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#06060f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
