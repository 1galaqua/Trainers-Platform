import { computeExerciseLogMetrics } from "@/lib/workout-log-metrics";
import { loadProgressExercisesForProgram } from "@/lib/program-sections-persistence";
import { prisma } from "@/lib/prisma";

export type ProgressExerciseChartItem = {
  id: string;
  name: string;
  data: Array<{ date: string; weight: number; volume: number }>;
};

export async function loadProgressExerciseCharts(params: {
  traineeId: string;
  coachId?: string;
}): Promise<ProgressExerciseChartItem[]> {
  const programs = await prisma.trainingProgram.findMany({
    where: {
      traineeId: params.traineeId,
      isActive: true,
      ...(params.coachId ? { coachId: params.coachId } : {}),
    },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  });

  if (programs.length === 0) return [];

  const multiplePrograms = programs.length > 1;

  const results = await Promise.all(
    programs.map(async (program) => {
      const exercises = await loadProgressExercisesForProgram(program.id, params.traineeId);

      return Promise.all(
        exercises.map(async (exercise) => {
          const logs = await prisma.exerciseLog.findMany({
            where: {
              exerciseId: exercise.id,
              session: { traineeId: params.traineeId },
            },
            include: {
              session: true,
              exercise: true,
              setLogs: { orderBy: { setNumber: "asc" } },
            },
            orderBy: { session: { completedAt: "asc" } },
          });

          if (logs.length === 0) return null;

          const data = logs.map((log) => {
            const metrics = computeExerciseLogMetrics({
              weightKg: log.weightKg,
              repsCompleted: log.repsCompleted,
              setLogs: log.setLogs,
              defaultReps: log.exercise.reps,
              plannedSets: log.exercise.sets,
            });

            return {
              date: log.session.completedAt.toISOString(),
              weight: metrics.averageWeight,
              volume: metrics.volume,
            };
          });

          const baseName = exercise.archivedAt ? `${exercise.name} (ארכיון)` : exercise.name;
          const label = multiplePrograms ? `${baseName} (${program.name})` : baseName;

          return {
            id: exercise.id,
            name: label,
            data,
          };
        }),
      );
    }),
  );

  return results.flat().filter((item): item is ProgressExerciseChartItem => item != null);
}
