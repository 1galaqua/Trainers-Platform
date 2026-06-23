import { MEASUREMENT_FIELDS, type MeasurementFieldKey } from "@/lib/measurements-validation";

export type TrackingChartPoint = {
  date: string;
  weight: number;
  volume: number;
  notes?: string | null;
};

export type MeasurementsLogRecord = {
  recordedAt: Date;
  notes: string | null;
} & Partial<Record<MeasurementFieldKey, number | null>>;

export function mapMeasurementsLogsToChartSeries(logs: MeasurementsLogRecord[]) {
  const sorted = logs.slice().sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  return MEASUREMENT_FIELDS.map((field) => {
    const data: TrackingChartPoint[] = [];

    for (const log of sorted) {
      const value = log[field.key];
      if (value == null) continue;

      data.push({
        date: log.recordedAt.toISOString(),
        weight: value,
        volume: value,
        notes: log.notes,
      });
    }

    return {
      id: field.progressId,
      name: field.label,
      kind: "measurement" as const,
      data,
    };
  }).filter((series) => series.data.length > 0);
}

export function getLatestMeasurements(logs: MeasurementsLogRecord[]) {
  return logs[0] ?? null;
}
