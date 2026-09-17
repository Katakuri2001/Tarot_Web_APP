import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/hooks/useShared";

interface ReadingTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  href: string;
  color: string;
}

export default function ReadingTypeCard({ title, description, icon: Icon, count, href, color }: ReadingTypeCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      className="group block p-6 rounded-xl border border-gold-400/10 bg-midnight/50 hover:border-gold-400/30 transition-all duration-500"
      whileHover={!reducedMotion ? { y: -6, borderColor: "rgba(212,184,90,0.3)" } : {}}
      transition={reducedMotion ? { duration: 0.3 } : { duration: 0.4, ease: "easeOut" }}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border transition-colors duration-500`} style={{ borderColor: `${color}40`, backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="font-serif-display text-xl text-warmwhite mb-2" style={{ fontWeight: 500 }}>{title}</h3>
      <p className="text-coolgray text-sm leading-relaxed mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wider uppercase" style={{ color }}>
          {count}-card reading
        </span>
        <span className="text-gold-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm tracking-wider">
          Begin →
        </span>
      </div>
    </motion.a>
  );
}
