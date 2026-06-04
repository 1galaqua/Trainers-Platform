import { redirect } from "next/navigation";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { OfflineDbBanner } from "@/features/dashboard/components/offline-db-banner";
import { isClerkConfigured } from "@/config/clerk";
import { getCurrentUser, isOfflineDemoSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && !isClerkConfigured() && !(await isOfflineDemoSession())) {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerifiedAt: true },
    });
    if (!record?.emailVerifiedAt) {
      redirect("/verify-email/pending");
    }
  }

  return (
    <DashboardShell userRole={user?.role ?? "COACH"}>
      <div className="space-y-4">
        <OfflineDbBanner />
        {children}
      </div>
    </DashboardShell>
  );
}
