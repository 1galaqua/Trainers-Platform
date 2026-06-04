"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CURRENT_ONBOARDING_VERSION_ID } from "@/lib/onboarding-versions";

type OnboardingDocumentDownloadProps = {
  traineeId: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  questionnaireId?: string;
  agreementId?: string;
  includeQuestionnaire?: boolean;
  includeAgreement?: boolean;
  disabled?: boolean;
};

function buildExportUrl(
  traineeId: string,
  options: {
    questionnaireId: string;
    agreementId: string;
    includeQuestionnaire: boolean;
    includeAgreement: boolean;
  },
) {
  const params = new URLSearchParams();
  params.set("questionnaireId", options.questionnaireId);
  params.set("agreementId", options.agreementId);
  if (!options.includeQuestionnaire) params.set("questionnaire", "0");
  if (!options.includeAgreement) params.set("agreement", "0");
  return `/api/trainees/${traineeId}/onboarding-export?${params.toString()}`;
}

export function OnboardingDocumentDownload({
  traineeId,
  label = "הורדה",
  variant = "outline",
  size = "sm",
  questionnaireId = CURRENT_ONBOARDING_VERSION_ID,
  agreementId = CURRENT_ONBOARDING_VERSION_ID,
  includeQuestionnaire = true,
  includeAgreement = true,
  disabled = false,
}: OnboardingDocumentDownloadProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (disabled || (!includeQuestionnaire && !includeAgreement)) return;

    setLoading(true);
    try {
      const url = buildExportUrl(traineeId, {
        questionnaireId,
        agreementId,
        includeQuestionnaire,
        includeAgreement,
      });
      const previewUrl = `/dashboard/trainees/${traineeId}/onboarding-export?${new URL(url).searchParams.toString()}`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        window.open(previewUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const html = await response.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const suffix = [
        includeQuestionnaire ? "questionnaire" : null,
        includeAgreement ? "agreement" : null,
      ]
        .filter(Boolean)
        .join("-");
      link.download = `onboarding-${suffix}-${traineeId}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(`/dashboard/trainees/${traineeId}/onboarding-export`, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={loading || disabled}
      onClick={handleDownload}
    >
      <Download className="size-4" />
      {loading ? "מוריד..." : label}
    </Button>
  );
}
