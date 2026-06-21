"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
);

type SidebarLogoutButtonProps = {
  onNavigate?: () => void;
  className?: string;
};

function SidebarLogoutButtonLocal({ className }: SidebarLogoutButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-start gap-2", className)}
        onClick={() => setConfirming(true)}
      >
        <LogOut className="size-4" aria-hidden />
        התנתקות
      </Button>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-lg border border-border bg-muted/30 p-3", className)}>
      <p className="font-medium text-sm">האם אתה בטוח שברצונך להתנתק?</p>
      <div className="flex gap-2">
        <form action={logoutAction} className="flex-1">
          <Button type="submit" variant="destructive" size="sm" className="w-full">
            כן
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setConfirming(false)}
        >
          לא
        </Button>
      </div>
    </div>
  );
}

function SidebarLogoutButtonClerk({ onNavigate, className }: SidebarLogoutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const clerk = useClerk();

  async function handleLogout() {
    setLoading(true);
    try {
      await clerk.signOut({ redirectUrl: "/" });
    } finally {
      setLoading(false);
      onNavigate?.();
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-start gap-2", className)}
        onClick={() => setConfirming(true)}
      >
        <LogOut className="size-4" aria-hidden />
        התנתקות
      </Button>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-lg border border-border bg-muted/30 p-3", className)}>
      <p className="font-medium text-sm">האם אתה בטוח שברצונך להתנתק?</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={loading}
          onClick={() => void handleLogout()}
        >
          {loading ? "מתנתק..." : "כן"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={loading}
          onClick={() => setConfirming(false)}
        >
          לא
        </Button>
      </div>
    </div>
  );
}

export function SidebarLogoutButton(props: SidebarLogoutButtonProps) {
  if (hasClerk) {
    return <SidebarLogoutButtonClerk {...props} />;
  }

  return <SidebarLogoutButtonLocal {...props} />;
}
