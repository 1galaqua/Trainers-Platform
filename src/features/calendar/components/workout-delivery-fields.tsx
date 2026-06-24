"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  workoutDeliveryModeLabels,
  type WorkoutDeliveryMode,
} from "@/lib/workout-delivery";

type WorkoutDeliveryFieldsProps = {
  deliveryMode: WorkoutDeliveryMode;
  onDeliveryModeChange: (mode: WorkoutDeliveryMode) => void;
  meetingLink: string;
  onMeetingLinkChange: (link: string) => void;
};

export function WorkoutDeliveryFields({
  deliveryMode,
  onDeliveryModeChange,
  meetingLink,
  onMeetingLinkChange,
}: WorkoutDeliveryFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>סוג מפגש</Label>
        <div className="flex gap-2">
          {(["IN_PERSON", "ONLINE"] as WorkoutDeliveryMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                deliveryMode === mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
              onClick={() => onDeliveryModeChange(mode)}
            >
              {workoutDeliveryModeLabels[mode]}
            </button>
          ))}
        </div>
        <input type="hidden" name="deliveryMode" value={deliveryMode} />
      </div>

      {deliveryMode === "ONLINE" && (
        <div className="space-y-2">
          <Label htmlFor="meetingLink">קישור לאימון</Label>
          <Input
            id="meetingLink"
            name="meetingLink"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://zoom.us/j/..."
            value={meetingLink}
            onChange={(event) => onMeetingLinkChange(event.target.value)}
            required
          />
        </div>
      )}
    </div>
  );
}
