import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OnboardingExportToolbar } from "@/features/onboarding/components/onboarding-export-toolbar";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { buildOnboardingExportHtml } from "@/lib/onboarding-export-html";
import { fetchTraineeOnboardingExportData } from "@/lib/fetch-onboarding-export";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TraineeOnboardingExportPage({ params }: PageProps) {
  const coach = await requireCoach();
  const { id: traineeId } = await params;

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) notFound();

  const data = await fetchTraineeOnboardingExportData(coach.id, traineeId);
  if (!data) notFound();

  const html = buildOnboardingExportHtml(data);
  const safeName =
    data.traineeName.replace(/[^\w\u0590-\u05FF\s-]/g, "").trim() || "trainee";

  return (
    <div className="space-y-4">
      <OnboardingExportToolbar
        traineeId={traineeId}
        traineeName={safeName}
        backHref={`/dashboard/trainees/${traineeId}`}
      />
      <iframe
        title={`שאלון וחתימה — ${data.traineeName}`}
        srcDoc={html}
        className="min-h-[75vh] w-full rounded-lg border border-border bg-white"
      />
    </div>
  );
}
