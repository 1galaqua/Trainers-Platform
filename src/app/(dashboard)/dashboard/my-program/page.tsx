import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { getCurrentUser, getTraineeOnboardingStatus } from "@/lib/auth";
import { programTypeLabels } from "@/lib/program-labels";
import { getActiveProgramAction } from "@/server/actions/workouts";

export const metadata = {
  title: `התוכנית שלי | ${siteConfig.shortName}`,
};

export default async function MyProgramPage() {
  const user = await getCurrentUser();
  if (user?.role !== "TRAINEE") redirect("/dashboard");

  const onboarding = await getTraineeOnboardingStatus(user.id);
  if (!onboarding.isComplete) {
    if (!onboarding.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
    redirect("/dashboard/onboarding/agreement");
  }

  const program = await getActiveProgramAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">התוכנית שלי</h1>
          <p className="mt-1 text-muted-foreground text-sm">תרגילים, הוראות וסרטונים</p>
        </div>
        {program && (
          <Button render={<Link href="/dashboard/workouts/log" />}>דיווח אימון</Button>
        )}
      </div>

      {!program ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            המאמן/ית עדיין לא הקצה לך תוכנית אימון.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-lg">{program.name}</h2>
            <Badge variant="secondary">{programTypeLabels[program.type]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">מאמן/ית: {program.coach.displayName ?? "—"}</p>

          <div className="space-y-4">
            {program.exercises.map((ex, index) => (
              <Card key={ex.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {ex.name}
                  </CardTitle>
                  <CardDescription>
                    {ex.sets} סטים × {ex.reps} חזרות · מנוחה {ex.restSeconds} שנ׳
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {ex.instructions && <p>{ex.instructions}</p>}
                  {ex.coachNotes && (
                    <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                      {ex.coachNotes}
                    </p>
                  )}
                  {ex.youtubeUrl && (
                    <a
                      href={ex.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      צפייה בסרטון
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
