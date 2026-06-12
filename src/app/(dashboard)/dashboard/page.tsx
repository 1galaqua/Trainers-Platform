import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { siteConfig } from "@/config/site";
import { getAdminCoachStats } from "@/lib/admin-stats";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getCoachProgramsAction } from "@/server/actions/programs";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    await requireAdmin();
    const coaches = await getAdminCoachStats();
    return <AdminDashboard coaches={coaches} adminName={user.displayName} />;
  }

  if (user?.role === "TRAINEE") {
    redirect("/dashboard/my-program");
  }

  const programs = await getCoachProgramsAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">סקירה כללית</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          ברוכים הבאים ל־{siteConfig.name}
          {user?.displayName ? `, ${user.displayName}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/trainees" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">תוכניות פעילות</CardTitle>
              <CardDescription>סה״כ במערכת</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl">{programs.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/workouts" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card className="h-full cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">אימונים שבוצעו</CardTitle>
              <CardDescription>על ידי מתאמנים</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-3xl">
                {programs.reduce((sum, p) => sum + p._count.sessions, 0)}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button size="sm" render={<Link href="/dashboard/workouts/new" />}>
              תוכנית חדשה
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/trainees" />}>
              מתאמנים
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
