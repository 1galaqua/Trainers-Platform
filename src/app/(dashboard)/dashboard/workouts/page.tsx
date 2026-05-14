import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אימונים",
};

export default function WorkoutsPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">אימונים</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        תוכניות אימון וסשנים יתווספו כאן כמודולים תחת{" "}
        <code className="font-mono text-xs">src/features</code>.
      </p>
    </div>
  );
}
