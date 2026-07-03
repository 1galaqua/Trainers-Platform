"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyWeightHistory } from "@/features/body-weight/components/body-weight-history";
import { BodyWeightLogForm } from "@/features/body-weight/components/body-weight-log-form";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { BODY_WEIGHT_PROGRESS_ID } from "@/lib/body-weight-validation";
import { type BodyWeightPageData } from "@/server/actions/body-weight";

type BodyWeightPageContentProps = {
  data: BodyWeightPageData;
  openLogForm?: boolean;
};

function formatWeightDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return "ללא שינוי מהרישום הקודם";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ק״ג מהרישום הקודם`;
}

export function BodyWeightPageContent({ data, openLogForm = false }: BodyWeightPageContentProps) {
  const deltaLabel = formatWeightDelta(data.latestWeightKg, data.previousWeightKg);

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">משקל גוף</h1>
          <p className="mt-1 text-muted-foreground text-base">מעקב משקל גוף יומי</p>
        </div>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto" render={<Link href="/dashboard/tracking" />}>
          חזרה למעקב
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">משקל היום / אחרון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-semibold text-2xl">
            {data.latestWeightKg != null ? `${data.latestWeightKg} ק״ג` : "—"}
          </p>
          {deltaLabel && <p className="text-muted-foreground text-base">{deltaLabel}</p>}
        </CardContent>
      </Card>

      <ProgressPageClient
        series={
          data.chartData.length > 0
            ? [
                {
                  id: BODY_WEIGHT_PROGRESS_ID,
                  name: "משקל גוף",
                  kind: "body-weight",
                  data: data.chartData,
                },
              ]
            : []
        }
        defaultSelectedId={BODY_WEIGHT_PROGRESS_ID}
        emptyMessage="אין עדיין נתונים לגרף. עדכן/י משקל כדי להתחיל."
      />

      <Card id="log-weight">
        <CardHeader>
          <CardTitle className="text-base">{openLogForm ? "עדכון משקל" : "רישום משקל"}</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyWeightLogForm defaultWeightKg={data.latestWeightKg} />
        </CardContent>
      </Card>

      <BodyWeightHistory logs={data.logs} />
    </div>
  );
}
