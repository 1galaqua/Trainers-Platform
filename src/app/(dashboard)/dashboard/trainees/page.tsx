import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { requireCoach } from "@/lib/auth";
import { getCoachTraineesAction } from "@/server/actions/programs";
import { getCoachTraineeProgressAction } from "@/server/actions/workouts";

export const metadata = {
  title: `מתאמנים | ${siteConfig.shortName}`,
};

export default async function TraineesPage() {
  await requireCoach();
  const trainees = await getCoachTraineesAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">מתאמנים</h1>
        <p className="mt-1 text-muted-foreground text-sm">מעקב אחר מתאמנים, תוכניות והתקדמות</p>
      </div>

      {trainees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין מתאמנים משויכים אליך. מתאמנים נרשמים ובוחרים אותך כמאמן/ית — ואז יופיעו כאן.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {await Promise.all(
            trainees.map(async (trainee) => {
              const sessions = await getCoachTraineeProgressAction(trainee.id);
              const activeProgram = trainee.programsAsTrainee[0];

              return (
                <Card key={trainee.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{trainee.displayName ?? "מתאמן"}</CardTitle>
                      <div className="flex gap-2">
                        {trainee.questionnaireResponse ? (
                          <Badge variant="secondary">שאלון הושלם</Badge>
                        ) : (
                          <Badge variant="outline">ממתין לשאלון</Badge>
                        )}
                        {activeProgram && <Badge>תוכנית פעילה</Badge>}
                      </div>
                    </div>
                    <CardDescription>
                      {sessions.length} אימונים שבוצעו
                      {activeProgram ? ` · ${activeProgram.name}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" render={<Link href={`/dashboard/trainees/${trainee.id}`} />}>
                      צפייה בהתקדמות
                    </Button>
                    <Button variant="outline" size="sm" render={<Link href="/dashboard/workouts/new" />}>
                      תוכנית חדשה
                    </Button>
                  </CardContent>
                </Card>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
