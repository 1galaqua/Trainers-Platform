import type { LucideIcon } from "lucide-react";
import { BarChart3, Calendar, ClipboardList, Dumbbell } from "lucide-react";

import type { UserRole } from "@/lib/prisma-client";

export type HeaderShortcut = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const traineeHeaderShortcuts: HeaderShortcut[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: BarChart3 },
  { href: "/dashboard/my-program", label: "התוכניות שלי", icon: ClipboardList },
  { href: "/dashboard/calendar", label: "יומן", icon: Calendar },
];

export const coachHeaderShortcuts: HeaderShortcut[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: BarChart3 },
  { href: "/dashboard/workouts", label: "תוכניות אימון", icon: Dumbbell },
  { href: "/dashboard/calendar", label: "יומן", icon: Calendar },
];

export function getHeaderShortcutsForRole(role: UserRole): HeaderShortcut[] {
  if (role === "COACH") return coachHeaderShortcuts;
  if (role === "TRAINEE") return traineeHeaderShortcuts;
  return [];
}

export const coachNavigation = [
  { title: "לוח בקרה", href: "/dashboard", description: "סיכום ופעילות" },
  { title: "מתאמנים", href: "/dashboard/trainees", description: "רשימה והתקדמות" },
  { title: "תוכניות אימון", href: "/dashboard/workouts", description: "יצירה וניהול" },
  { title: "שאלון והסכם", href: "/dashboard/onboarding-template", description: "תבנית לעלייה" },
  { title: "יומן", href: "/dashboard/calendar", description: "אימונים מתוכננים" },
  { title: "עדכונים", href: "/dashboard/updates", description: "הודעות ועדכונים" },
] as const;

export const traineeNavigation = [
  { title: "לוח בקרה", href: "/dashboard", description: "אימונים וגרפים" },
  { title: "התוכניות שלי", href: "/dashboard/my-program", description: "תרגילים וסרטונים" },
  { title: "דיווח אימון", href: "/dashboard/workouts/log", description: "משקלים וחזרות" },
  { title: "יומן", href: "/dashboard/calendar", description: "אימונים מתוכננים" },
  { title: "עדכונים", href: "/dashboard/updates", description: "הודעות ועדכונים" },
] as const;

export const adminNavigation = [
  { title: "ניהול מאמנים", href: "/dashboard", description: "מאמנים ומתאמנים" },
] as const;

export function getNavigationForRole(role: UserRole) {
  if (role === "ADMIN") return adminNavigation;
  if (role === "COACH") return coachNavigation;
  return traineeNavigation;
}
