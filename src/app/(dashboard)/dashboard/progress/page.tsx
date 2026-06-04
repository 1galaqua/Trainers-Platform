import { siteConfig } from "@/config/site";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { requireTraineeOnboarded } from "@/lib/auth";
import { getTraineeProgramsAction, getExerciseProgressAction } from "@/server/actions/workouts";

export const metadata = {
  title: `התקדמות | ${siteConfig.shortName}`,
};

export default async function ProgressPage() {
  await requireTraineeOnboarded();
  const programs = await getTraineeProgramsAction();

  const exercises = await Promise.all(
    programs.flatMap((program) =>
      program.exercises.map(async (ex) => {
        const data = await getExerciseProgressAction(ex.id);
        const label =
          programs.length > 1 ? `${ex.name} (${program.name})` : ex.name;
        return {
          id: ex.id,
          name: label,
          data: data.map((d) => ({
            date: d.date,
            weight: d.weight,
            volume: d.volume,
          })),
        };
      }),
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">גרפי התקדמות</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          מעקב משקל ונפח אימון לפי תאריך
          {programs.length > 1 ? " · מכל התוכניות הפעילות" : ""}
        </p>
      </div>
      <ProgressPageClient exercises={exercises} />
    </div>
  );
}
