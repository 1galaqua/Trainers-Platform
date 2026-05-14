import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/config/clerk";
import { siteConfig } from "@/config/site";
import { getDemoRoster } from "@/lib/demo-roster";
import { refreshDashboardAction } from "@/server/actions/example";

export default async function DashboardHomePage() {
  const { userId } = isClerkConfigured()
    ? await auth()
    : { userId: null as string | null };

  const roster = await getDemoRoster();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">סקירה כללית</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          ברוכים הבאים ל־{siteConfig.name}. עמוד זה מרונדר בצד השרת.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="font-medium text-base">נתוני דמו</h2>
        <p className="mt-1 text-muted-foreground text-xs">
          מקור: {roster.source === "database" ? "מסד הנתונים (Prisma)" : "ברירת מחדל בקוד (ללא DB)"}
        </p>
        <ul className="mt-4 space-y-3">
          {roster.users.map((u) => (
            <li
              key={u.clerkId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-sm"
            >
              <span className="font-medium">{u.displayName ?? "—"}</span>
              <span className="text-muted-foreground">
                {u.role === "COACH" ? "מאמן" : "מתאמן"}
              </span>
            </li>
          ))}
        </ul>
        {roster.source === "static" && (
          <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
            להטענת הנתונים ל־PostgreSQL הריצו: <code className="font-mono">npx prisma db push</code> ואז{" "}
            <code className="font-mono">npx prisma db seed</code>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
        <p className="text-sm leading-relaxed">
          {isClerkConfigured() ? (
            userId ? (
              <>
                מחוברים. ניתן לקשר משתמשי Clerk למשתמשי Prisma באמצעות{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">userId</code> בצד
                השרת.
              </>
            ) : (
              <>לא אמור לקרות: לוח הבקרה מוגן כשה־Clerk מופעל.</>
            )
          ) : (
            <>
              Clerk לא מוגדר — בפיתוח ניתן להיכנס לכאן ללא התחברות. הוסיפו מפתחות ב־
              <code className="font-mono text-xs">.env.local</code> כדי להפעיל התחברות.
            </>
          )}
        </p>
      </div>

      <form action={refreshDashboardAction} className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          רענון סקירה (פעולת שרת)
        </Button>
        <span className="text-muted-foreground text-xs">
          דוגמה: <code className="font-mono">src/server/actions/example.ts</code>
        </span>
      </form>
    </div>
  );
}
