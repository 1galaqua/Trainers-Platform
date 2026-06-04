import Link from "next/link";

import { Button } from "@/components/ui/button";
import { demoPeople } from "@/config/demo";
import { siteConfig } from "@/config/site";
import { MarketingAuthCta } from "@/features/marketing/components/marketing-auth-cta";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="font-semibold tracking-tight">{siteConfig.shortName}</span>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <MarketingAuthCta />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-2xl space-y-6">
            <p className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
              מאמנים ומתאמנים
            </p>
            <h1 className="font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-foreground text-sm leading-relaxed">
              <span className="text-muted-foreground">דמו: </span>
              המאמן{" "}
              <span className="font-medium">{demoPeople.trainer.fullName}</span>
              {`, המתאמן `}
              <span className="font-medium">{demoPeople.trainee.fullName}</span>.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button render={<Link href="/dashboard" />} size="lg">
                כניסה לאפליקציה
              </Button>
              <MarketingAuthCta size="lg" variant="outline" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "מתאמנים",
                body: "ניהול רשימות, הקצאת תוכניות ומעקב אחרי ביצוע במקום אחד.",
              },
              {
                title: "אימונים ותזונה",
                body: "פרסום תוכניות מובנות שהלקוחות יכולים לעקוב אחריהן מכל מקום.",
              },
              {
                title: "התקדמות",
                body: "גרפים ודיווחי אימונים כדי שההתקדמות תישאר ברורה וגלויה.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
              >
                <h2 className="font-semibold text-base">{card.title}</h2>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground text-sm sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}. כל הזכויות שמורות.
        </div>
      </footer>
    </div>
  );
}
