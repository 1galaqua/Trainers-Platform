import type { Metadata } from "next";

import { demoPeople } from "@/config/demo";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "מתאמנים",
};

export default function TraineesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl tracking-tight">מתאמנים</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        כאן יוצגו רשימת המתאמנים וההתקדמות. נתוני דמו: מתאמן{" "}
        <span className="font-medium text-foreground">{demoPeople.trainee.fullName}</span>{" "}
        (מאמן הדמו: {demoPeople.trainer.fullName}).
      </p>
      <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
        <p className="font-medium text-sm">{demoPeople.trainee.fullName}</p>
        <p className="mt-1 text-muted-foreground text-xs">מתאמן · {siteConfig.shortName}</p>
      </div>
    </div>
  );
}
