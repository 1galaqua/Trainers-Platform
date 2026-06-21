import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { CoachDashboardHome } from "@/features/dashboard/components/coach-dashboard-home";
import { TraineeDashboardHome } from "@/features/dashboard/components/trainee-dashboard-home";
import { getAdminCoachStats } from "@/lib/admin-stats";
import { getCurrentUser, requireAdmin, requireTraineeOnboarded } from "@/lib/auth";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    await requireAdmin();
    const coaches = await getAdminCoachStats();
    return <AdminDashboard coaches={coaches} adminName={user.displayName} />;
  }

  if (user?.role === "TRAINEE") {
    await requireTraineeOnboarded();
    return <TraineeDashboardHome traineeName={user.displayName} />;
  }

  return <CoachDashboardHome coachName={user?.displayName} />;
}
