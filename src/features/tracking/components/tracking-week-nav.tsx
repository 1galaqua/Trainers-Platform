"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getNextWeekStart, getPreviousWeekStart } from "@/lib/tracking-week-navigation";

type TrackingWeekNavProps = {
  weekStart: string;
  weekLabel: string;
  canGoForward: boolean;
  traineeId: string | null;
};

export function TrackingWeekNav({
  weekStart,
  weekLabel,
  canGoForward,
  traineeId,
}: TrackingWeekNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildHref(nextWeekStart: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", nextWeekStart);
    if (traineeId) params.set("traineeId", traineeId);
    else params.delete("traineeId");
    return `/dashboard/tracking?${params.toString()}`;
  }

  const prevWeek = getPreviousWeekStart(weekStart);
  const nextWeek = getNextWeekStart(weekStart);

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="שבוע קודם"
          render={<Link href={buildHref(prevWeek)} />}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <p className="min-w-0 text-center font-medium text-sm">{weekLabel}</p>
        {canGoForward ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="שבוע הבא"
            render={<Link href={buildHref(nextWeek)} />}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled aria-label="שבוע הבא (חסום)">
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
