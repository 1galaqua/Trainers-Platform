import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { LogWorkoutForm } from "@/features/workouts/components/log-workout-form";
import { requireTraineeOnboarded } from "@/lib/auth";
import { getActiveProgramAction } from "@/server/actions/workouts";

export const metadata = {
  title: `דיווח אימון | ${siteConfig.shortName}`,
};

export default async function LogWorkoutPage() {
  await requireTraineeOnboarded();
  const program = await getActiveProgramAction();

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין תוכנית פעילה.{" "}
            <Link href="/dashboard/my-program" className="text-primary underline">
              חזרה לתוכנית
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון</h1>
        <p className="mt-1 text-muted-foreground text-sm">{program.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">עדכון ביצוע</CardTitle>
        </CardHeader>
        <CardContent>
          <LogWorkoutForm programId={program.id} exercises={program.exercises} />
        </CardContent>
      </Card>
    </div>
  );
}
