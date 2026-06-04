"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type OnboardingDocumentDownloadProps = {
  traineeId: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
};

export function OnboardingDocumentDownload({
  traineeId,
  label = "הורדת שאלון + חתימה",
  variant = "outline",
  size = "sm",
}: OnboardingDocumentDownloadProps) {
  const href = `/api/trainees/${traineeId}/onboarding-export`;

  return (
    <Button variant={variant} size={size} render={<a href={href} download />} nativeButton={false}>
      <Download className="size-4" />
      {label}
    </Button>
  );
}
