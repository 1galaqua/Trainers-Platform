import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CreateProgramForm } from "@/features/programs/components/create-program-form";
import { requireCoach } from "@/lib/auth";
import { getCoachTraineesAction } from "@/server/actions/programs";

export const metadata = {
  title: `תוכנית חדשה | ${siteConfig.shortName}`,
};

export default async function NewWorkoutPage() {
  await requireCoach();
  const trainees = await getCoachTraineesAction();

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
            <p className="text-muted-foreground text-sm leading-relaxed">
              אין לך מתאמנים משויכים. מתאמנים נרשמים ובוחרים אותך כמאמן/ית — אז יופיעו כאן.
            </p>
          ) : (
            <CreateProgramForm
              trainees={trainees.map((t) => ({ id: t.id, displayName: t.displayName }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
