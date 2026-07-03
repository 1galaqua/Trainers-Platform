"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaterHistory } from "@/features/water/components/water-history";
import { WaterLogForm } from "@/features/water/components/water-log-form";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { formatWaterDisplay, WATER_PROGRESS_ID } from "@/lib/water-validation";
import { type WaterPageData } from "@/server/actions/water";

type WaterPageContentProps = {
  data: WaterPageData;
  openLogForm?: boolean;
};

export function WaterPageContent({ data, openLogForm = false }: WaterPageContentProps) {
  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">שתייה</h1>
          <p className="mt-1 text-muted-foreground text-base">מעקב צריכת מים יומית</p>
        </div>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto" render={<Link href="/dashboard/tracking" />}>
          חזרה למעקב
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">שתייה היום / אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-2xl">
            {data.latestAmountMl != null ? formatWaterDisplay(data.latestAmountMl) : "—"}
          </p>
        </CardContent>
      </Card>

      <ProgressPageClient
        series={
          data.chartData.length > 0
            ? [{ id: WATER_PROGRESS_ID, name: "שתייה", kind: "water", data: data.chartData }]
            : []
        }
        defaultSelectedId={WATER_PROGRESS_ID}
        emptyMessage="אין עדיין נתונים לגרף. עדכן/י שתייה כדי להתחיל."
      />

      <Card id="log-water">
        <CardHeader>
          <CardTitle className="text-base">{openLogForm ? "עדכון שתייה" : "רישום שתייה"}</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterLogForm defaultAmountMl={data.latestAmountMl} />
        </CardContent>
      </Card>

      <WaterHistory logs={data.logs} />
    </div>
  );
}
