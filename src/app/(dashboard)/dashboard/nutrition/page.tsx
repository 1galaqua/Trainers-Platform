import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תזונה",
};

export default function NutritionPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">תזונה</h1>
      <p className="text-muted-foreground text-base leading-relaxed">
        תוכניות תזונה ומאקרו — ניתן לממש עם Server Actions ושינויים ב־Prisma.
      </p>
    </div>
  );
}
