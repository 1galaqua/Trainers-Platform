"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { AuthUserButton } from "@/features/dashboard/components/auth-user-button";
import { cn } from "@/lib/utils";

import type { UserRole } from "@/lib/prisma-client";

import { getNavigationForRole } from "../config/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  userRole: UserRole;
};

function NavLinks({
  userRole,
  onNavigate,
}: {
  userRole: UserRole;
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

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children, userRole }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
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
            <NavLinks userRole={userRole} />
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3 text-muted-foreground text-xs leading-relaxed">
          {siteConfig.name}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-border border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label="פתיחת תפריט ניווט"
                  />
                }
              >
                <Menu className="size-5" aria-hidden />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="gap-0 p-0 [&>button]:top-3.5 sm:max-w-xs"
              >
                <div className="flex h-14 items-center border-border border-b px-4">
                  <span className="font-semibold">תפריט</span>
                </div>
                <ScrollArea className="h-[calc(100dvh-3.5rem)]">
                  <div className="p-3">
                    <NavLinks userRole={userRole} onNavigate={() => setMobileNavOpen(false)} />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <span className="truncate font-medium text-sm">{siteConfig.shortName}</span>
          </div>
          <AuthUserButton />
        </header>

        <header className="hidden h-14 shrink-0 items-center justify-end gap-3 border-border border-b px-4 md:flex md:px-6">
          <AuthUserButton />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
