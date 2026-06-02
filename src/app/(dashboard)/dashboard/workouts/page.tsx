import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { programTypeLabels } from "@/lib/program-labels";
import { requireCoach } from "@/lib/auth";
import { getCoachProgramsAction } from "@/server/actions/programs";

export const metadata = {
  title: `תוכניות אימון | ${siteConfig.shortName}`,
};

export default async function WorkoutsPage() {
  await requireCoach();
  const programs = await getCoachProgramsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">תוכניות אימון</h1>
          <p className="mt-1 text-muted-foreground text-sm">יצירה וניהול תוכניות למתאמנים</p>
        </div>
        <Button render={<Link href="/dashboard/workouts/new" />}>
          <Plus className="size-4" />
          תוכנית חדשה
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין עדיין תוכניות. צור תוכנית ראשונה למתאמן.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{program.name}</CardTitle>
                  <Badge variant="secondary">{programTypeLabels[program.type]}</Badge>
                </div>
                <CardDescription>{program.trainee.displayName ?? "מתאמן"}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {program._count.exercises} תרגילים · {program._count.sessions} אימונים שבוצעו
                </span>
                <Button variant="outline" size="sm" render={<Link href={`/dashboard/workouts/${program.id}`} />}>
                  צפייה
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
