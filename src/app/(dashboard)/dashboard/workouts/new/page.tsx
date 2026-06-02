import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CreateProgramForm } from "@/features/programs/components/create-program-form";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: `תוכנית חדשה | ${siteConfig.shortName}`,
};

export default async function NewWorkoutPage() {
  await requireCoach();

  let trainees: Array<{ id: string; displayName: string | null }> = [];
  try {
    const coach = await requireCoach();
    const links = await prisma.coachTrainee.findMany({
      where: { coachId: coach.id },
      include: { trainee: true },
    });
    trainees = links.map((l) => l.trainee);

    if (trainees.length === 0) {
      const allTrainees = await prisma.user.findMany({ where: { role: "TRAINEE" } });
      trainees = allTrainees;
    }
  } catch {
    trainees = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/workouts" aria-label="חזרה" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">תוכנית אימון חדשה</h1>
          <p className="mt-1 text-muted-foreground text-sm">הגדר תרגילים, סטים, חזרות וסרטוני YouTube</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התוכנית</CardTitle>
        </CardHeader>
        <CardContent>
          {trainees.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              אין מתאמנים במערכת. הריצו <code className="font-mono">npm run db:seed</code> לטעינת נתוני דמו.
            </p>
          ) : (
            <CreateProgramForm trainees={trainees} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
