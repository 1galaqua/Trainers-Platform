import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { LogWorkoutPageContent } from "@/features/workouts/components/log-workout-page-content";
import { getLogWorkoutPageDataAction } from "@/server/actions/workouts";

export const metadata = {
  title: `דיווח אימון | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ program?: string }>;
};

export default async function LogWorkoutPage({ searchParams }: PageProps) {
  const { program: programParam } = await searchParams;
  const { programSummaries, activeProgram, quotaInfo } =
    await getLogWorkoutPageDataAction(programParam);

  if (programSummaries.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-semibold text-2xl tracking-tight">דיווח אימון</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-base">
            אין תוכניות פעילות.{" "}
            <Link href="/dashboard/my-program" className="text-primary underline">
              חזרה לתוכניות
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
        <p className="mt-1 text-muted-foreground text-base">
          בחר את התוכנית שביצעת באימון זה, ואז מלא את פרטי הביצוע
        </p>
      </div>

      <LogWorkoutPageContent
        programSummaries={programSummaries}
        activeProgram={activeProgram}
        initialProgramId={programParam}
        quotaInfo={quotaInfo}
      />
    </div>
  );
}
