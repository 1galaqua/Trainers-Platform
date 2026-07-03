"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementsHistory } from "@/features/measurements/components/measurements-history";
import { MeasurementsLogForm } from "@/features/measurements/components/measurements-log-form";
import { MeasurementsTable } from "@/features/measurements/components/measurements-table";
import type { MeasurementsPageData } from "@/server/actions/measurements";

type MeasurementsPageContentProps = {
  traineeId: string;
  data: MeasurementsPageData;
};

export function MeasurementsPageContent({ traineeId, data }: MeasurementsPageContentProps) {
  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">היקפים</h1>
          <p className="mt-1 text-muted-foreground text-base">הזנת היקפים בס&quot;מ</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" render={<Link href="/dashboard/tracking" />}>
          חזרה למעקב
        </Button>
      </div>

      <MeasurementsTable logs={data.logs} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">הזנת היקפים</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementsLogForm traineeId={traineeId} />
        </CardContent>
      </Card>

      <MeasurementsHistory traineeId={traineeId} logs={data.logs} />
    </div>
  );
}
