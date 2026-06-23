"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterTraineesByNameAndIds } from "@/lib/trainee-name-search";
import type { TrackingTraineeOption } from "@/server/actions/tracking";

type CoachTrackingTraineePickerProps = {
  trainees: TrackingTraineeOption[];
  selectedTraineeId: string | null;
};

export function CoachTrackingTraineePicker({
  trainees,
  selectedTraineeId,
}: CoachTrackingTraineePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrainees = useMemo(
    () => filterTraineesByNameAndIds(trainees, searchQuery),
    [trainees, searchQuery],
  );

  function selectTrainee(traineeId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("traineeId", traineeId);
    router.push(`/dashboard/tracking?${params.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-2">
        <Label htmlFor="tracking-trainee-search">חיפוש מתאמן</Label>
        <Input
          id="tracking-trainee-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="הקלד/י שם..."
        />
      </div>

      <div className="max-h-48 space-y-1 overflow-y-auto">
        {filteredTrainees.length === 0 ? (
          <p className="text-muted-foreground text-sm">לא נמצאו מתאמנים</p>
        ) : (
          filteredTrainees.map((trainee) => (
            <button
              key={trainee.id}
              type="button"
              onClick={() => selectTrainee(trainee.id)}
              className={`w-full rounded-md px-3 py-2 text-right text-sm transition-colors ${
                selectedTraineeId === trainee.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/60"
              }`}
            >
              {trainee.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
