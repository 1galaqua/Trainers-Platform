"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

type OnboardingExportToolbarProps = {
  traineeId: string;
  traineeName: string;
  backHref: string;
};

export function OnboardingExportToolbar({
  traineeId,
  traineeName,
  backHref,
}: OnboardingExportToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="sm" render={<Link href={backHref} />}>
        חזרה למתאמן
      </Button>
      <Button
        variant="default"
        size="sm"
        render={
          <a
            href={`/api/trainees/${traineeId}/onboarding-export`}
            download={`onboarding-${traineeName}.html`}
          />
        }
      >
        הורדה כקובץ HTML
      </Button>
      <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
        הדפסה / שמירה כ-PDF
      </Button>
    </div>
  );
}
