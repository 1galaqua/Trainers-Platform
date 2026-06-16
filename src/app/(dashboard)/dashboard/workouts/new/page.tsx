import { siteConfig } from "@/config/site";
import { NewProgramPageContent } from "@/features/programs/components/new-program-page-content";
import { requireCoach } from "@/lib/auth";
import { getCoachTraineesAction } from "@/server/actions/programs";

export const metadata = {
  title: `תוכנית חדשה | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ traineeId?: string }>;
};

export default async function NewWorkoutPage({ searchParams }: PageProps) {
  await requireCoach();
  const { traineeId: traineeIdParam } = await searchParams;
  const trainees = await getCoachTraineesAction();
  const initialTraineeId =
    traineeIdParam && trainees.some((trainee) => trainee.id === traineeIdParam)
      ? traineeIdParam
      : undefined;

  return (
    <NewProgramPageContent
      trainees={trainees.map((trainee) => ({ id: trainee.id, displayName: trainee.displayName }))}
      initialTraineeId={initialTraineeId}
    />
  );
}
