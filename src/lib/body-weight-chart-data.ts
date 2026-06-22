import { getIsraelDateString } from "@/lib/calendar-datetime";

export type BodyWeightChartPoint = {
  date: string;
  weight: number;
  volume: number;
};

export type BodyWeightLogRecord = {
  id: string;
  weightKg: number;
  recordedAt: Date;
  recordedDay: string;
  notes: string | null;
};

export type QuestionnaireStartingWeight = {
  weightKg: number;
  completedAt: Date;
};

export function mapBodyWeightLogsToChartData(logs: BodyWeightLogRecord[]): BodyWeightChartPoint[] {
  return logs
    .slice()
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map((log) => ({
      date: log.recordedAt.toISOString(),
      weight: log.weightKg,
      volume: log.weightKg,
    }));
}

export function appendQuestionnaireStartingWeight(
  chartData: BodyWeightChartPoint[],
  startingWeight: QuestionnaireStartingWeight | null,
): BodyWeightChartPoint[] {
  if (!startingWeight) return chartData;

  const startingDay = getIsraelDateString(startingWeight.completedAt);
  const hasLogOnStartingDay = chartData.some(
    (point) => getIsraelDateString(new Date(point.date)) === startingDay,
  );

  if (hasLogOnStartingDay) return chartData;

  const startingPoint: BodyWeightChartPoint = {
    date: startingWeight.completedAt.toISOString(),
    weight: startingWeight.weightKg,
    volume: startingWeight.weightKg,
  };

  return [...chartData, startingPoint].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function resolveBodyWeightCurrentDisplay(
  logs: Array<{ weightKg: number }>,
  questionnaireWeightKg: number | null,
) {
  const latestFromLog = logs[0]?.weightKg ?? null;

  return {
    latestWeightKg: latestFromLog ?? questionnaireWeightKg,
    previousWeightKg: logs[1]?.weightKg ?? null,
  };
}
