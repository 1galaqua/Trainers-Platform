import { PushNotificationSetup } from "@/features/push/components/push-notification-setup";
import { PushServiceWorkerRegister } from "@/features/push/components/push-service-worker-register";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let unreadNotificationCount = 0;

  if (user && user.role !== "ADMIN") {
    try {
      unreadNotificationCount = await getUnreadNotificationCountForUser(user.id);
    } catch {
      unreadNotificationCount = 0;
    }
  }

  return (
    <DashboardShell
      userRole={user?.role ?? "COACH"}
      unreadNotificationCount={unreadNotificationCount}
    >
      {user && user.role !== "ADMIN" && (
        <>
          <PushServiceWorkerRegister />
          <div className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-6">
            <PushNotificationSetup />
          </div>
        </>
      )}
      {children}
    </DashboardShell>
  );
}
