"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import {
  cancelGroupWorkoutRegistrationAction,
  registerForGroupWorkoutAction,
} from "@/server/actions/calendar";

type GroupWorkoutActionsProps = {
  workout: CalendarWorkoutItem;
  compact?: boolean;
};

function isUpcoming(startsAt: string) {
  return new Date(startsAt) > new Date();
}

export function GroupWorkoutActions({ workout, compact = false }: GroupWorkoutActionsProps) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (workout.type !== "GROUP" || !isUpcoming(workout.startsAt)) {
    return null;
  }

  const spotsLeft =
    workout.maxParticipants != null
      ? workout.maxParticipants - workout.registeredCount
      : 0;
  const isFull = spotsLeft <= 0;

  async function handleRegister() {
    setLoading(true);
    setError(null);

    const result = await registerForGroupWorkoutAction(workout.id);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const result = await cancelGroupWorkoutRegistrationAction(workout.id);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setConfirmingCancel(false);
    router.refresh();
  }

  if (workout.isRegistered) {
    if (confirmingCancel) {
      return (
        <div
          className={
            compact
              ? "mt-2 space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-2"
              : "mt-3 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
          }
        >
          <p className={compact ? "text-xs" : "text-sm"}>האם אתה בטוח שברצונך לבטל?</p>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size={compact ? "sm" : "default"}
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? "מבטל..." : "כן, בטל רישום"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={() => {
                setConfirmingCancel(false);
                setError(null);
              }}
              disabled={loading}
            >
              לא
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "default"}
          className={compact ? "h-7 w-full text-xs" : "w-full"}
          onClick={() => setConfirmingCancel(true)}
        >
          בטל רישום
        </Button>
      </div>
    );
  }

  if (isFull) {
    return (
      <p
        className={cn(
          compact ? "mt-2 text-muted-foreground text-[11px]" : "mt-2 text-muted-foreground text-sm",
          "font-medium",
        )}
      >
        אין מקומות פנויים
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        className={compact ? "h-7 w-full text-xs" : "w-full"}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "נרשם..." : "הירשם לאימון"}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
