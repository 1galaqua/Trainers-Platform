import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <DashboardShell userRole={user?.role ?? "COACH"}>
      {children}
    </DashboardShell>
  );
}
