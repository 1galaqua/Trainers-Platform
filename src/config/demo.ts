/**
 * נתוני הדמו — מאמן ומתאמן (גם משמשים ב-seed של Prisma).
 * מזהי Clerk מדומים: `demo_clerk_coach`, `demo_clerk_trainee`
 */
export const demoPeople = {
  trainer: {
    fullName: "יהודה אמסלם",
    clerkId: "demo_clerk_coach",
    role: "COACH" as const,
  },
  trainee: {
    fullName: "גל אקוע",
    clerkId: "demo_clerk_trainee",
    role: "TRAINEE" as const,
  },
} as const;
