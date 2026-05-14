export const dashboardNavigation = [
  { title: "סקירה", href: "/dashboard", description: "סיכום ופעילות" },
  {
    title: "מתאמנים",
    href: "/dashboard/trainees",
    description: "רשימה והתקדמות",
  },
  {
    title: "אימונים",
    href: "/dashboard/workouts",
    description: "תוכניות ואימונים",
  },
  {
    title: "תזונה",
    href: "/dashboard/nutrition",
    description: "תוכניות תזונה",
  },
  { title: "תוכן", href: "/dashboard/content", description: "פוסטים ומדיה" },
] as const;
