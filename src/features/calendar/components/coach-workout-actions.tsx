"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";
import { cancelScheduledWorkoutAction } from "@/server/actions/calendar";

import { EditWorkoutButton } from "./edit-workout-sheet";

type CoachWorkoutActionsProps = {
  workout: CalendarWorkoutItem;
  trainees: CalendarTraineeOption[];
  compact?: boolean;
};

function isUpcoming(startsAt: string) {
  return new Date(startsAt) > new Date();
}

export function CoachWorkoutActions({
  workout,
  trainees,
  compact = false,
}: CoachWorkoutActionsProps) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isUpcoming(workout.startsAt)) {
    return null;
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const result = await cancelScheduledWorkoutAction(workout.id);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setConfirmingCancel(false);
    router.refresh();
  }

  if (confirmingCancel) {
    return (
      <div
        className={
          compact
            ? "mt-2 space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-2"
            : "mt-3 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
        }
      >
        <p className={compact ? "text-xs" : "text-sm"}>האם אתה בטוח שברצונך לבטל את האימון?</p>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex w-full min-w-0 flex-wrap gap-1">
          <Button
            type="button"
            variant="destructive"
            size={compact ? "sm" : "default"}
            className={compact ? "min-w-0 flex-1 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink"}
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? "מבטל..." : "כן, בטל אימון"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            className={compact ? "min-w-0 flex-1 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink"}
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
    <div
      className={cn(
        "flex w-full min-w-0 gap-1",
        compact ? "mt-2 flex-col" : "mt-3 flex-row gap-2",
      )}
    >
      <EditWorkoutButton workout={workout} trainees={trainees} compact={compact} />
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn(
          compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
        )}
        onClick={() => setConfirmingCancel(true)}
      >
        <Trash2 className="size-3.5" aria-hidden />
        ביטול
      </Button>
    </div>
  );
}
