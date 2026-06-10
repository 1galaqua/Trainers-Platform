"use client";

import { useState, type RefObject } from "react";
import Link from "next/link";
import { Download, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  downloadOnboardingPdfFromIframe,
  printOnboardingFromIframe,
  printOnboardingHtml,
} from "@/lib/onboarding-export-client";

type OnboardingExportToolbarProps = {
  html: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  iframeReady: boolean;
  traineeId: string;
  traineeName: string;
  backHref: string;
  htmlDownloadHref?: string;
};

export function OnboardingExportToolbar({
  html,
  iframeRef,
  iframeReady,
  traineeId,
  traineeName,
  backHref,
  htmlDownloadHref,
}: OnboardingExportToolbarProps) {
  const [printing, setPrinting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadHref =
    htmlDownloadHref ?? `/api/trainees/${traineeId}/onboarding-export`;

  const exportDisabled = printing || pdfLoading;

  async function handlePrint() {
    setPrinting(true);
    setError(null);
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        await printOnboardingFromIframe(iframe);
      } else {
        printOnboardingHtml(html);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בהדפסה");
    } finally {
      setPrinting(false);
    }
  }

  async function handleDownloadPdf() {
    const iframe = iframeRef.current;
    if (!iframe) {
      setError("המסמך עדיין נטען — נסה/י שוב בעוד רגע");
      return;
    }

    setPdfLoading(true);
    setError(null);
    try {
      await downloadOnboardingPdfFromIframe(iframe, `onboarding-${traineeName}`);
    } catch {
      setError("שגיאה ביצירת קובץ PDF. נסה/י שוב או הורד/י HTML.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" render={<Link href={backHref} />}>
          חזרה למתאמן
        </Button>
        <Button
          variant="default"
          size="sm"
          render={
            <a
              href={downloadHref}
              download={`onboarding-${traineeName}.html`}
            />
          }
        >
          <Download className="size-4" />
          הורדת HTML
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={exportDisabled}
          onClick={handleDownloadPdf}
        >
          <FileText className="size-4" />
          {pdfLoading ? "יוצר PDF..." : "הורדת PDF"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={exportDisabled}
          onClick={handlePrint}
        >
          <Printer className="size-4" />
          {printing ? "פותח הדפסה..." : "הדפסה"}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {!iframeReady && (
        <p className="text-muted-foreground text-xs">טוען תצוגת מסמך...</p>
      )}
      <p className="text-muted-foreground text-xs">
        הורדת PDF שומרת קובץ ישירות. בהדפסה אפשר גם לבחור «שמירה כ-PDF» בתפריט המדפסת.
      </p>
    </div>
  );
}
