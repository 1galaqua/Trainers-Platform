import { computeSleepHours } from "@/lib/sleep-validation";

export type TrackingChartPoint = {
  date: string;
  weight: number;
  volume: number;
  notes?: string | null;
  sleepStart?: string;
  sleepEnd?: string;
};

export type SleepLogRecord = {
  sleepStart: string;
  sleepEnd: string;
  recordedAt: Date;
  notes: string | null;
};

export function mapSleepLogsToChartData(logs: SleepLogRecord[]): TrackingChartPoint[] {
  return logs
    .slice()
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map((log) => ({
      date: log.recordedAt.toISOString(),
      weight: computeSleepHours(log.sleepStart, log.sleepEnd),
      volume: computeSleepHours(log.sleepStart, log.sleepEnd),
      notes: log.notes,
      sleepStart: log.sleepStart,
      sleepEnd: log.sleepEnd,
    }));
}

export function resolveSleepCurrentDisplay(logs: SleepLogRecord[]) {
  const latest = logs[0];
  const previous = logs[1];

  return {
    latestHours: latest ? computeSleepHours(latest.sleepStart, latest.sleepEnd) : null,
    previousHours: previous ? computeSleepHours(previous.sleepStart, previous.sleepEnd) : null,
    latestSleepStart: latest?.sleepStart ?? null,
    latestSleepEnd: latest?.sleepEnd ?? null,
  };
}
