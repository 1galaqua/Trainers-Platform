"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { DashboardHeaderActions } from "@/features/dashboard/components/dashboard-header-actions";
import { AppBadgeSync } from "@/features/push/components/app-badge-sync";
import { SidebarLogoutButton } from "@/features/dashboard/components/sidebar-logout-button";
import { getUnreadNotificationCountAction } from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

import type { UserRole } from "@/lib/prisma-client";

import { getNavigationForRole } from "../config/navigation";

const UPDATES_HREF = "/dashboard/updates";

type DashboardShellProps = {
  children: React.ReactNode;
  userRole: UserRole;
  unreadNotificationCount?: number;
};

function NavLinks({
  userRole,
  unreadNotificationCount = 0,
  onNavigate,
}: {
  userRole: UserRole;
  unreadNotificationCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navigation = getNavigationForRole(userRole);

  return (
    <nav className="flex flex-col gap-1" aria-label="לוח בקרה">
      {navigation.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const showUnreadBadge =
          item.href === UPDATES_HREF && unreadNotificationCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{item.title}</span>
            {showUnreadBadge && (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
                aria-label={`${unreadNotificationCount} עדכונים חדשים`}
                title={`${unreadNotificationCount} עדכונים חדשים`}
              >
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  children,
  userRole,
  unreadNotificationCount = 0,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadNotificationCount);
  const showHeaderActions = userRole !== "ADMIN";

  useEffect(() => {
    setLiveUnreadCount(unreadNotificationCount);
  }, [unreadNotificationCount]);

  useEffect(() => {
    if (userRole === "ADMIN") return;

    let cancelled = false;

    async function refreshUnreadCount() {
      try {
        const count = await getUnreadNotificationCountAction();
        if (!cancelled) setLiveUnreadCount(count);
      } catch {
        // ignore polling errors
      }
    }

    const intervalId = window.setInterval(refreshUnreadCount, 30_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userRole]);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {showHeaderActions && <AppBadgeSync unreadCount={liveUnreadCount} />}
      <aside
        className="hidden w-full max-w-64 shrink-0 flex-col border-border border-e bg-sidebar text-sidebar-foreground md:flex"
        aria-label="סרגל צד"
      >
        <div className="flex h-14 items-center border-sidebar-border border-b px-4">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-sidebar-foreground"
          >
            {siteConfig.shortName}
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3">
            <NavLinks userRole={userRole} unreadNotificationCount={liveUnreadCount} />
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <SidebarLogoutButton />
        </div>
        <Separator />
        <div className="p-3 text-muted-foreground text-xs leading-relaxed">
          {siteConfig.name}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex min-h-14 items-end justify-between gap-3 border-border border-b bg-background/95 px-4 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-auto min-w-0 shrink-0 flex-col gap-0.5 px-1.5 py-1"
                  aria-label="פתיחת תפריט ניווט"
                />
              }
            >
              <Menu className="size-5 shrink-0" aria-hidden />
              <span className="max-w-[4.25rem] text-center text-[10px] leading-tight font-normal text-muted-foreground">
                תפריט
              </span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex flex-col gap-0 p-0 sm:max-w-xs [&>button]:top-3.5 [&>button]:right-auto [&>button]:left-3.5"
            >
              <div className="flex h-14 shrink-0 items-center border-border border-b px-4">
                <span className="font-semibold">תפריט</span>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-3">
                  <NavLinks
                    userRole={userRole}
                    unreadNotificationCount={liveUnreadCount}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                </div>
              </ScrollArea>
              <Separator />
              <div className="shrink-0 p-3">
                <SidebarLogoutButton onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          {showHeaderActions && (
            <DashboardHeaderActions userRole={userRole} unreadCount={liveUnreadCount} />
          )}
        </header>

        {showHeaderActions && (
          <header className="hidden min-h-14 shrink-0 items-end justify-end border-border border-b px-4 py-1 md:flex md:px-6">
            <DashboardHeaderActions userRole={userRole} unreadCount={liveUnreadCount} />
          </header>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
