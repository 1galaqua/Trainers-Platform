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
    <div className="flex min-w-0 items-end gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <HeaderQuickLinks userRole={userRole} className="shrink-0" />
      <UpdatesBellButton unreadCount={unreadCount} className="shrink-0" />
    </div>
  );
}
