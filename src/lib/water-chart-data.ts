export type TrackingChartPoint = {
  date: string;
  weight: number;
  volume: number;
  notes?: string | null;
};

export type WaterLogRecord = {
  amountMl: number;
  recordedAt: Date;
  notes: string | null;
};

export function mapWaterLogsToChartData(logs: WaterLogRecord[]): TrackingChartPoint[] {
  return logs
    .slice()
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map((log) => ({
      date: log.recordedAt.toISOString(),
      weight: log.amountMl,
      volume: log.amountMl,
      notes: log.notes,
    }));
}

export function resolveWaterCurrentDisplay(logs: Array<{ amountMl: number }>) {
  return {
    latestAmountMl: logs[0]?.amountMl ?? null,
    previousAmountMl: logs[1]?.amountMl ?? null,
  };
}
