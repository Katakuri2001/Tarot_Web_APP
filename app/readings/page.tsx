"use client";

import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";
import Navigation from "@/components/Navigation";
import ReadingTypeCard from "@/components/reading/ReadingTypeCard";
import { Heart, Sparkles, Briefcase, Compass } from "lucide-react";

const readingTypes = [
  {
    href: "/readings/daily",
    title: "Daily Reading",
    description: "A single card reveals the energy surrounding your day. What awaits you?",
    icon: Sparkles,
    count: 1,
    color: "#d4b85a",
  },
  {
    href: "/readings/love",
    title: "Love Reading",
    description: "Past, present, and future. Three cards illuminate your romantic journey.",
    icon: Heart,
    count: 3,
    color: "#e06c9f",
  },
  {
    href: "/readings/career",
    title: "Career Reading",
    description: "Your situation, the challenge ahead, and the advice the cards offer.",
    icon: Briefcase,
    count: 3,
    color: "#5b9bd5",
  },
  {
    href: "/readings/general",
    title: "General Reading",
    description: "Past, present, and future through a broader lens of your life.",
    icon: Compass,
    count: 3,
    color: "#a78bfa",
  },
];

export default function ReadingsPage() {
  return (
    <>
      <StarBackground />
      <Navigation />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gold-300 tracking-widest uppercase text-xs mb-4">Choose Your Path</p>
            <h1 className="font-serif-display text-4xl md:text-5xl text-warmwhite mb-4" style={{ fontWeight: 300 }}>
              Select Your Reading
            </h1>
            <p className="text-moonlight max-w-xl mx-auto">
              Each reading type offers a unique lens through which the cards can speak to you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {readingTypes.map((type, i) => (
              <ReadingTypeCard key={type.href} {...type} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
