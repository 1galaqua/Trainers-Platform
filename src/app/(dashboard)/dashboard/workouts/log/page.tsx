import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { LogWorkoutPageContent } from "@/features/workouts/components/log-workout-page-content";
import { requireTraineeOnboarded } from "@/lib/auth";
import { getTraineeProgramsAction, getTraineeLogQuotaAction } from "@/server/actions/workouts";
import { buildLogWorkoutProgramOption } from "@/lib/log-workout-program-option";

export const metadata = {
  title: `דיווח אימון | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ program?: string }>;
};

function LogWorkoutFallback() {
  return <p className="text-muted-foreground text-sm">טוען...</p>;
}

export default async function LogWorkoutPage({ searchParams }: PageProps) {
  await requireTraineeOnboarded();
  const { program: programParam } = await searchParams;
  const [programs, quotaInfo] = await Promise.all([
    getTraineeProgramsAction(),
    getTraineeLogQuotaAction(),
  ]);

  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין תוכניות פעילות.{" "}
            <Link href="/dashboard/my-program" className="text-primary underline">
              חזרה לתוכניות
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const programOptions = programs.map((program) => buildLogWorkoutProgramOption(program));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          בחר את התוכנית שביצעת באימון זה, ואז מלא את פרטי הביצוע
        </p>
      </div>

      <Suspense fallback={<LogWorkoutFallback />}>
        <LogWorkoutPageContent
          programs={programOptions}
          initialProgramId={programParam}
          quotaInfo={quotaInfo}
        />
      </Suspense>
    </div>
  );
}
