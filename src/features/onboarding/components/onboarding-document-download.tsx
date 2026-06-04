"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const url = `/api/trainees/${traineeId}/onboarding-export`;
      const previewUrl = `/dashboard/trainees/${traineeId}/onboarding-export`;
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
      link.download = `onboarding-${traineeId}.html`;
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
      disabled={loading}
      onClick={handleDownload}
    >
      <Download className="size-4" />
      {loading ? "מוריד..." : label}
    </Button>
  );
}
