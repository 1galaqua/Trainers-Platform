"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SleepHistory } from "@/features/sleep/components/sleep-history";
import { SleepLogForm } from "@/features/sleep/components/sleep-log-form";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { formatSleepRange, SLEEP_PROGRESS_ID } from "@/lib/sleep-validation";
import { type SleepPageData } from "@/server/actions/sleep";

type SleepPageContentProps = {
  data: SleepPageData;
  openLogForm?: boolean;
};

export function SleepPageContent({ data, openLogForm = false }: SleepPageContentProps) {
  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">שינה</h1>
          <p className="mt-1 text-muted-foreground text-sm">מעקב שעות שינה לפי יום ההתעוררות</p>
        </div>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto" render={<Link href="/dashboard/tracking" />}>
          חזרה למעקב
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">שינה אחרונה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-semibold text-2xl">
            {data.latestHours != null ? `${data.latestHours} שעות` : "—"}
          </p>
          {data.latestSleepStart && data.latestSleepEnd && (
            <p className="text-muted-foreground text-sm">
              {formatSleepRange(data.latestSleepStart, data.latestSleepEnd)}
            </p>
          )}
        </CardContent>
      </Card>

      <ProgressPageClient
        series={
          data.chartData.length > 0
            ? [{ id: SLEEP_PROGRESS_ID, name: "שינה", kind: "sleep", data: data.chartData }]
            : []
        }
        defaultSelectedId={SLEEP_PROGRESS_ID}
        emptyMessage="אין עדיין נתונים לגרף. עדכן/י שינה כדי להתחיל."
      />

      <Card id="log-sleep">
        <CardHeader>
          <CardTitle className="text-base">{openLogForm ? "עדכון שינה" : "רישום שינה"}</CardTitle>
        </CardHeader>
        <CardContent>
          <SleepLogForm
            defaultSleepStart={data.latestSleepStart ?? undefined}
            defaultSleepEnd={data.latestSleepEnd ?? undefined}
          />
        </CardContent>
      </Card>

      <SleepHistory logs={data.logs} />
    </div>
  );
}
