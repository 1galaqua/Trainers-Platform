"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpdatesBellButtonProps = {
  unreadCount: number;
  className?: string;
};

export function UpdatesBellButton({ unreadCount, className }: UpdatesBellButtonProps) {
  const pathname = usePathname();
  const active = pathname === "/dashboard/updates" || pathname.startsWith("/dashboard/updates/");

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto min-w-0 flex-col gap-0.5 px-1.5 py-1",
        active && "bg-muted text-foreground",
        className,
      )}
      render={<Link href="/dashboard/updates" aria-label="עדכונים" />}
    >
      <span className="relative shrink-0">
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -left-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
            aria-label={`${unreadCount} עדכונים שלא נקראו`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
      <span
        className={cn(
          "max-w-[4.25rem] text-center text-[10px] leading-tight font-normal",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        עדכונים
      </span>
    </Button>
  );
}
