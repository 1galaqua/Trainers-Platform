import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { LogWorkoutPageContent } from "@/features/workouts/components/log-workout-page-content";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";
import {
  getCoachTraineeProgramsAction,
  getCoachTraineeLogQuotaAction,
} from "@/server/actions/workouts";
import { buildLogWorkoutProgramOption } from "@/lib/log-workout-program-option";

export const metadata = {
  title: `דיווח אימון למתאמן | ${siteConfig.shortName}`,
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ program?: string }>;
};

function LogWorkoutFallback() {
  return <p className="text-muted-foreground text-sm">טוען...</p>;
}

export default async function CoachLogTraineeWorkoutPage({ params, searchParams }: PageProps) {
  const coach = await requireCoach();
  const { id: traineeId } = await params;
  const { program: programParam } = await searchParams;

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) notFound();

  let trainee;
  try {
    trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      select: { id: true, displayName: true, role: true },
    });
  } catch {
    notFound();
  }

  if (!trainee || trainee.role !== "TRAINEE") notFound();

  const [programs, quotaInfo] = await Promise.all([
    getCoachTraineeProgramsAction(traineeId),
    getCoachTraineeLogQuotaAction(traineeId),
  ]);
  const name = trainee.displayName ?? "מתאמן";
  const logBasePath = `/dashboard/trainees/${traineeId}/log`;

  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/dashboard/trainees/${traineeId}`} aria-label="חזרה" />}
          >
            <ArrowRight className="size-4" />
          </Button>
          <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון — {name}</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין תוכניות פעילות למתאמן זה.{" "}
            <Link href={`/dashboard/workouts/new?traineeId=${traineeId}`} className="text-primary underline">
              צור תוכנית חדשה
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const programOptions = programs.map((program) => buildLogWorkoutProgramOption(program));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/dashboard/trainees/${traineeId}`} aria-label="חזרה" />}
        >
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון — {name}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            בחר את התוכנית שבוצעה באימון זה, ואז מלא את פרטי הביצוע
          </p>
        </div>
      </div>

      <Suspense fallback={<LogWorkoutFallback />}>
        <LogWorkoutPageContent
          programs={programOptions}
          initialProgramId={programParam}
          logBasePath={logBasePath}
          emptyBackHref={`/dashboard/trainees/${traineeId}`}
          emptyBackLabel="חזרה למתאמן"
          coachTraineeId={traineeId}
          redirectTo={`/dashboard/trainees/${traineeId}`}
          quotaInfo={quotaInfo}
        />
      </Suspense>
    </div>
  );
}
