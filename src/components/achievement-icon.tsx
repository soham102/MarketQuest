import { Anchor, Book, Brain, Flag, GraduationCap, Library, Receipt, Shield, Shuffle, Trophy } from "lucide-react";
import type { Achievement } from "@/content/achievements";

const ICONS = {
  book: Book,
  books: Library,
  trophy: Trophy,
  shuffle: Shuffle,
  flag: Flag,
  brain: Brain,
  shield: Shield,
  anchor: Anchor,
  graduation: GraduationCap,
  receipt: Receipt,
} as const;

export function AchievementIcon({ icon, className }: { icon: Achievement["icon"]; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
