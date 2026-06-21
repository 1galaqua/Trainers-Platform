"use client";

import type { UserRole } from "@/lib/prisma-client";

import { HeaderQuickLinks } from "./header-quick-links";
import { UpdatesBellButton } from "./updates-bell-button";

type DashboardHeaderActionsProps = {
  userRole: UserRole;
  unreadCount: number;
};

export function DashboardHeaderActions({ userRole, unreadCount }: DashboardHeaderActionsProps) {
  if (userRole === "ADMIN") return null;

  return (
    <div className="flex items-end gap-3">
      <HeaderQuickLinks userRole={userRole} />
      <UpdatesBellButton unreadCount={unreadCount} />
    </div>
  );
}
