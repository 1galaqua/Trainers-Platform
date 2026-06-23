import {
  appendQuestionnaireStartingWeight,
  mapBodyWeightLogsToChartData,
  resolveBodyWeightCurrentDisplay,
} from "@/lib/body-weight-chart-data";
import { prisma } from "@/lib/prisma";

async function getQuestionnaireStartingWeight(traineeId: string) {
  const response = await prisma.questionnaireResponse.findUnique({
    where: { traineeId },
    select: { weightKg: true, completedAt: true },
  });

  if (!response?.weightKg) return null;

  return {
    weightKg: response.weightKg,
    completedAt: response.completedAt,
  };
}

export async function loadBodyWeightChartData(traineeId: string) {
  const [logs, startingWeight] = await Promise.all([
    prisma.bodyWeightLog.findMany({
      where: { traineeId },
      orderBy: { recordedAt: "asc" },
    }),
    getQuestionnaireStartingWeight(traineeId),
  ]);

  const chartData = mapBodyWeightLogsToChartData(logs);
  return appendQuestionnaireStartingWeight(chartData, startingWeight);
}

export async function loadBodyWeightCurrentDisplay(traineeId: string) {
  const [logs, startingWeight] = await Promise.all([
    prisma.bodyWeightLog.findMany({
      where: { traineeId },
      orderBy: { recordedAt: "desc" },
      take: 2,
      select: { weightKg: true },
    }),
    getQuestionnaireStartingWeight(traineeId),
  ]);

  return resolveBodyWeightCurrentDisplay(logs, startingWeight?.weightKg ?? null);
}

export async function loadBodyWeightReminder(traineeId: string) {
  return prisma.bodyWeightReminder.findUnique({
    where: { traineeId },
    select: { enabled: true, daysOfWeek: true, timeLocal: true },
  });
}
