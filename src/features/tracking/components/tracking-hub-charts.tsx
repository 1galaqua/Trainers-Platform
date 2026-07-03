"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/features/progress/components/progress-chart";
import type { ProgressChartPoint } from "@/features/progress/components/progress-page-client";
import { BODY_WEIGHT_PROGRESS_ID } from "@/lib/body-weight-validation";
import { SLEEP_PROGRESS_ID } from "@/lib/sleep-validation";
import { WATER_PROGRESS_ID } from "@/lib/water-validation";
import { cn } from "@/lib/utils";

const TRACKING_CHARTS = [
  {
    id: BODY_WEIGHT_PROGRESS_ID,
    name: "משקל גוף",
    kind: "body-weight" as const,
    href: "/dashboard/body-weight",
    weightLabel: "משקל גוף (ק״ג)",
    emptyMessage: "אין עדיין נתונים — לחץ/י לעדכון משקל",
  },
  {
    id: WATER_PROGRESS_ID,
    name: "שתייה",
    kind: "water" as const,
    href: "/dashboard/water",
    weightLabel: 'שתייה (מ"ל)',
    emptyMessage: "אין עדיין נתונים — לחץ/י לעדכון שתייה",
  },
  {
    id: SLEEP_PROGRESS_ID,
    name: "שינה",
    kind: "sleep" as const,
    href: "/dashboard/sleep",
    weightLabel: "שעות שינה",
    emptyMessage: "אין עדיין נתונים — לחץ/י לעדכון שינה",
  },
];

type TrackingHubChartsProps = {
  seriesById: Record<string, ProgressChartPoint[]>;
  clickable?: boolean;
};

function ChartCard({
  title,
  data,
  weightLabel,
  emptyMessage,
  href,
  clickable,
}: {
  title: string;
  data: ProgressChartPoint[];
  weightLabel: string;
  emptyMessage: string;
  href: string;
  clickable: boolean;
}) {
  const card = (
    <Card
      className={cn(
        "min-w-0 overflow-hidden transition-colors",
        clickable && "cursor-pointer hover:border-primary/40 hover:bg-muted/20",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {clickable && (
          <span className="text-muted-foreground text-sm">לחץ/י לעדכון</span>
        )}
      </CardHeader>
      <CardContent className="min-w-0">
        {data.length > 0 ? (
          <ProgressChart
            data={data}
            mode="weight"
            weightLabel={weightLabel}
            showNotesInTooltip
          />
        ) : (
          <p className="py-8 text-center text-muted-foreground text-base">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );

  if (!clickable) return card;

  return (
    <Link href={href} className="block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}

export function TrackingHubCharts({ seriesById, clickable = false }: TrackingHubChartsProps) {
  return (
    <div className="min-w-0 space-y-6">
      {TRACKING_CHARTS.map((chart) => (
        <ChartCard
          key={chart.id}
          title={chart.name}
          data={seriesById[chart.id] ?? []}
          weightLabel={chart.weightLabel}
          emptyMessage={
            clickable ? chart.emptyMessage : "אין עדיין נתונים להצגה"
          }
          href={chart.href}
          clickable={clickable}
        />
      ))}
    </div>
  );
}

export { TRACKING_CHARTS };
