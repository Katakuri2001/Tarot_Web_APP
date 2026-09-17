"use client";

import React, { ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";

export default class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Velora Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <StarBackground />
          <Navigation />
          <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-gold-400/20 flex items-center justify-center">
                <span className="text-gold-300 text-2xl">✦</span>
              </div>
              <h1 className="font-serif-display text-2xl text-warmwhite mb-4">
                Something interrupted your reading.
              </h1>
              <p className="text-moonlight mb-8">
                The cards may be shuffling. Let&apos;s try again.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 text-sm tracking-wider hover:border-gold-400/60 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = "/"}
                  className="px-6 py-3 rounded-full border border-gold-400/30 text-coolgray text-sm tracking-wider hover:text-warmwhite hover:border-gold-400/60 transition-all"
                >
                  Return Home
                </button>
              </div>
            </div>
          </main>
        </>
      );
    }

    return this.props.children;
  }
}
