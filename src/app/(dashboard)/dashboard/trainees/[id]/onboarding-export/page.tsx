import { notFound } from "next/navigation";

import { OnboardingExportViewer } from "@/features/onboarding/components/onboarding-export-viewer";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { buildOnboardingExportHtml } from "@/lib/onboarding-export-html";
import { fetchTraineeOnboardingExportData } from "@/lib/fetch-onboarding-export";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function TraineeOnboardingExportPage({
  params,
  searchParams,
}: PageProps) {
  const coach = await requireCoach();
  const { id: traineeId } = await params;
  const query = await searchParams;

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) notFound();

  const includeQuestionnaire = firstParam(query.questionnaire) !== "0";
  const includeAgreement = firstParam(query.agreement) !== "0";

  const data = await fetchTraineeOnboardingExportData(coach.id, traineeId, {
    questionnaireId: firstParam(query.questionnaireId),
    agreementId: firstParam(query.agreementId),
    includeQuestionnaire,
    includeAgreement,
  });
  if (!data) notFound();

  const html = buildOnboardingExportHtml(data);
  const safeName =
    data.traineeName.replace(/[^\w\u0590-\u05FF\s-]/g, "").trim() || "trainee";

  const downloadParams = new URLSearchParams();
  const questionnaireId = firstParam(query.questionnaireId);
  const agreementId = firstParam(query.agreementId);
  if (questionnaireId) downloadParams.set("questionnaireId", questionnaireId);
  if (agreementId) downloadParams.set("agreementId", agreementId);
  if (!includeQuestionnaire) downloadParams.set("questionnaire", "0");
  if (!includeAgreement) downloadParams.set("agreement", "0");
  const htmlDownloadHref = `/api/trainees/${traineeId}/onboarding-export${
    downloadParams.toString() ? `?${downloadParams.toString()}` : ""
  }`;

  return (
    <OnboardingExportViewer
      html={html}
      traineeId={traineeId}
      traineeName={safeName}
      backHref={`/dashboard/trainees/${traineeId}`}
      title={`שאלון וחתימה — ${data.traineeName}`}
      htmlDownloadHref={htmlDownloadHref}
    />
  );
}
