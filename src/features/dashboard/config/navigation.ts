import type { UserRole } from "@/lib/prisma-client";

export const coachNavigation = [
  { title: "סקירה", href: "/dashboard", description: "סיכום ופעילות" },
  { title: "מתאמנים", href: "/dashboard/trainees", description: "רשימה והתקדמות" },
  { title: "תוכניות אימון", href: "/dashboard/workouts", description: "יצירה וניהול" },
  { title: "שאלון והסכם", href: "/dashboard/onboarding-template", description: "תבנית לעלייה" },
] as const;

export const traineeNavigation = [
  { title: "סקירה", href: "/dashboard", description: "סיכום" },
  { title: "התוכניות שלי", href: "/dashboard/my-program", description: "תרגילים וסרטונים" },
  { title: "דיווח אימון", href: "/dashboard/workouts/log", description: "משקלים וחזרות" },
  { title: "התקדמות", href: "/dashboard/progress", description: "גרפים" },
  { title: "תמונות", href: "/dashboard/photos", description: "העלאה ומעקב" },
] as const;

export function getNavigationForRole(role: UserRole) {
  return role === "COACH" ? coachNavigation : traineeNavigation;
}
