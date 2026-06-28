import { Suspense } from "react";
import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { CalendarPageContent } from "@/features/calendar/components/calendar-page-content";
import { requireTraineeOnboarded, requireUser } from "@/lib/auth";
import {
  getCalendarWorkoutsAction,
  getCoachTraineesForCalendarAction,
} from "@/server/actions/calendar";

export const metadata = {
  title: `יומן | ${siteConfig.shortName}`,
};

export default async function CalendarPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/dashboard");
  }

  if (user.role === "TRAINEE") {
    await requireTraineeOnboarded();
  }

  const [workouts, trainees] = await Promise.all([
    getCalendarWorkoutsAction(),
    user.role === "COACH"
      ? getCoachTraineesForCalendarAction()
      : Promise.resolve([]),
  ]);

  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">טוען יומן...</p>}>
      <CalendarPageContent
        userRole={user.role}
        scheduleItems={workouts}
        trainees={trainees}
      />
    </Suspense>
  );
}
