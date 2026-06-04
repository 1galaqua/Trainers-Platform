"use client";

import { useRef, useState } from "react";

import { OnboardingExportToolbar } from "@/features/onboarding/components/onboarding-export-toolbar";

type OnboardingExportViewerProps = {
  html: string;
  traineeId: string;
  traineeName: string;
  backHref: string;
  title: string;
  htmlDownloadHref?: string;
};

export function OnboardingExportViewer({
  html,
  traineeId,
  traineeName,
  backHref,
  title,
  htmlDownloadHref,
}: OnboardingExportViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  return (
    <div className="space-y-4">
      <OnboardingExportToolbar
        html={html}
        iframeRef={iframeRef}
        iframeReady={iframeReady}
        traineeId={traineeId}
        traineeName={traineeName}
        backHref={backHref}
        htmlDownloadHref={htmlDownloadHref}
      />
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={html}
        onLoad={() => setIframeReady(true)}
        className="min-h-[75vh] w-full rounded-lg border border-border bg-white"
      />
    </div>
  );
}
