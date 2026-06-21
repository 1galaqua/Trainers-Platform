"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getHeaderShortcutsForRole } from "@/features/dashboard/config/navigation";
import type { UserRole } from "@/lib/prisma-client";
import { cn } from "@/lib/utils";

type HeaderQuickLinksProps = {
  userRole: UserRole;
  className?: string;
};

function isShortcutActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderQuickLinks({ userRole, className }: HeaderQuickLinksProps) {
  const pathname = usePathname();
  const shortcuts = getHeaderShortcutsForRole(userRole);

  if (shortcuts.length === 0) return null;

  return (
    <div className={cn("flex items-end gap-3", className)}>
      {shortcuts.map(({ href, label, icon: Icon }) => {
        const active = isShortcutActive(pathname, href);

        return (
          <Button
            key={href}
            variant="ghost"
            className={cn(
              "h-auto min-w-0 flex-col gap-0.5 px-1.5 py-1",
              active && "bg-muted text-foreground",
            )}
            render={<Link href={href} aria-label={label} />}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span
              className={cn(
                "max-w-[4.25rem] text-center text-[10px] leading-tight font-normal",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
