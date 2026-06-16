import { redirect } from "next/navigation";

import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { CoachDashboardHome } from "@/features/dashboard/components/coach-dashboard-home";
import { getAdminCoachStats } from "@/lib/admin-stats";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

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

  return <CoachDashboardHome coachName={user?.displayName} />;
}
