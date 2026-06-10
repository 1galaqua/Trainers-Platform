"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    setIframeReady(false);
    const iframe = iframeRef.current;
    if (!iframe) return;

    const markReady = () => {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        setIframeReady(true);
        return true;
      }
      return false;
    };

    if (markReady()) return;

    const handleLoad = () => {
      markReady();
    };

    iframe.addEventListener("load", handleLoad);
    const interval = window.setInterval(() => {
      if (markReady()) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      window.clearInterval(interval);
    };
  }, [html]);

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
        className="min-h-[75vh] w-full rounded-lg border border-border bg-white"
      />
    </div>
  );
}
