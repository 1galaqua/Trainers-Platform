import type { UserRole } from "@/lib/prisma-client";

export const coachNavigation = [
  { title: "לוח בקרה", href: "/dashboard", description: "סיכום ופעילות" },
  { title: "מתאמנים", href: "/dashboard/trainees", description: "רשימה והתקדמות" },
  { title: "תוכניות אימון", href: "/dashboard/workouts", description: "יצירה וניהול" },
  { title: "שאלון והסכם", href: "/dashboard/onboarding-template", description: "תבנית לעלייה" },
  { title: "יומן", href: "/dashboard/calendar", description: "אימונים מתוכננים" },
  { title: "עדכונים", href: "/dashboard/updates", description: "הודעות ועדכונים" },
] as const;

export const traineeNavigation = [
  { title: "סקירה", href: "/dashboard", description: "סיכום" },
  { title: "התוכניות שלי", href: "/dashboard/my-program", description: "תרגילים וסרטונים" },
  { title: "דיווח אימון", href: "/dashboard/workouts/log", description: "משקלים וחזרות" },
  { title: "התקדמות", href: "/dashboard/progress", description: "גרפים" },
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
