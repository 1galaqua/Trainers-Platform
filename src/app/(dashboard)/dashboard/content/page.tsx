import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תוכן",
};

export default function ContentPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">תוכן</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        פוסטים ומדיה למאמן — יש לשלב אחסון (למשל S3) והרשאות לפי תפקיד.
      </p>
    </div>
  );
}
