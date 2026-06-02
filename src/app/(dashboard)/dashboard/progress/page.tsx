import { siteConfig } from "@/config/site";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { requireTraineeOnboarded } from "@/lib/auth";
import { getActiveProgramAction, getExerciseProgressAction } from "@/server/actions/workouts";

export const metadata = {
  title: `התקדמות | ${siteConfig.shortName}`,
};

export default async function ProgressPage() {
  await requireTraineeOnboarded();
  const program = await getActiveProgramAction();

  const exercises = program
    ? await Promise.all(
        program.exercises.map(async (ex) => {
          const data = await getExerciseProgressAction(ex.id);
          return {
            id: ex.id,
            name: ex.name,
            data: data.map((d) => ({
              date: d.date,
              weight: d.weight,
              volume: d.volume,
            })),
          };
        }),
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">גרפי התקדמות</h1>
        <p className="mt-1 text-muted-foreground text-sm">מעקב משקל ונפח אימון לפי תאריך</p>
      </div>
      <ProgressPageClient exercises={exercises} />
    </div>
  );
}
