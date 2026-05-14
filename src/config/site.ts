export const siteConfig = {
  name: "פלטפורמת מאמני כושר",
  shortName: "מאמנים",
  description:
    "פלטפורמת SaaS למאמני כושר: ניהול מתאמנים, תוכניות אימון ותזונה, תוכן והתקדמות — במקום אחד.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
