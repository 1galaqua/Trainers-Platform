import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTraineeInviteButton } from "@/features/invites/components/create-trainee-invite-button";
import { CoachTraineeMonthlyChart } from "@/features/dashboard/components/coach-trainee-monthly-chart";
import { Button } from "@/components/ui/button";
import { getCoachDashboardChartAction } from "@/server/actions/coach-dashboard";

type CoachDashboardHomeProps = {
  coachName?: string | null;
};

export async function CoachDashboardHome({ coachName }: CoachDashboardHomeProps) {
  const chartData = await getCoachDashboardChartAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">לוח בקרה</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {coachName ? `שלום, ${coachName}` : "מעקב אחר מתאמנים ופעילות"}
          </p>
        </div>
        <CreateTraineeInviteButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/trainees?filter=active" className="block">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">מתאמנים פעילים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl text-green-600">{chartData.currentActive}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/trainees?filter=inactive" className="block">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">מתאמנים לא פעילים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl text-red-500">{chartData.currentInactive}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/trainees" className="block">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">סה״כ מתאמנים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl">{chartData.currentTotal}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <CoachTraineeMonthlyChart data={chartData} />

      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/dashboard/trainees" />}>מתאמנים</Button>
        <Button variant="outline" render={<Link href="/dashboard/workouts/new" />}>
          תוכנית חדשה
        </Button>
        <Button variant="outline" render={<Link href="/dashboard/workouts" />}>
          תוכניות אימון
        </Button>
      </div>
    </div>
  );
}
