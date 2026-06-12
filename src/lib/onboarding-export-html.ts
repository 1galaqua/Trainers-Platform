import {
  answersFromLegacyResponse,
  formatAnswerValue,
  type QuestionField,
} from "@/lib/onboarding-template";

export type OnboardingExportData = {
  traineeName: string;
  traineeEmail: string | null;
  includeQuestionnaire: boolean;
  includeAgreement: boolean;
  questionnaireCompletedAt: string | null;
  agreementSignedAt: string | null;
  signatureUrl: string | null;
  agreementText: string | null;
  fields: QuestionField[];
  answers: Record<string, unknown> | null;
  legacy: {
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    goal: string | null;
    experience: string | null;
    injuries: string | null;
    sessionsPerWeek: number | null;
    equipment: string | null;
  } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function traineeMetaLine(data: OnboardingExportData) {
  return `מתאמן/ית: ${escapeHtml(data.traineeName)}${data.traineeEmail ? ` · ${escapeHtml(data.traineeEmail)}` : ""}`;
}

export function buildOnboardingExportHtml(data: OnboardingExportData) {
  const pages: string[] = [];
  const includeBoth = data.includeQuestionnaire && data.includeAgreement;

  if (data.includeQuestionnaire && data.legacy && data.questionnaireCompletedAt) {
    const answerMap =
      data.answers ??
      answersFromLegacyResponse({
        age: data.legacy.age,
        heightCm: data.legacy.heightCm,
        weightKg: data.legacy.weightKg,
        sessionsPerWeek: data.legacy.sessionsPerWeek,
        goal: data.legacy.goal,
        experience: data.legacy.experience,
        injuries: data.legacy.injuries,
        equipment: data.legacy.equipment,
      });

    const questionnaireRows = data.fields
      .map((field) => {
        const value = formatAnswerValue(answerMap[field.key], field);
        return `<tr><th>${escapeHtml(field.label)}</th><td>${escapeHtml(value)}</td></tr>`;
      })
      .join("");

    pages.push(`
  <section class="export-page${includeBoth ? " export-page--break" : ""}">
    <h1>שאלון ראשוני</h1>
    <p class="meta">${traineeMetaLine(data)}</p>
    <p class="meta">הושלם ב-${formatDate(data.questionnaireCompletedAt)}</p>
    <table>${questionnaireRows}</table>
  </section>`);
  }

  if (
    data.includeAgreement &&
    data.agreementSignedAt &&
    data.signatureUrl &&
    data.agreementText != null
  ) {
    pages.push(`
  <section class="export-page">
    <h1>הסכם וחתימה דיגיטלית</h1>
    <p class="meta">${traineeMetaLine(data)}</p>
    <p class="meta">נחתם ב-${formatDate(data.agreementSignedAt)}</p>
    <div class="agreement">${escapeHtml(data.agreementText)}</div>
    <div class="signature">
      <p><strong>חתימה:</strong></p>
      <img src="${data.signatureUrl}" alt="חתימת המתאמן" />
    </div>
  </section>`);
  }

  const title =
    data.includeQuestionnaire && data.includeAgreement
      ? "שאלון ראשוני והסכם חתום"
      : data.includeQuestionnaire
        ? "שאלון ראשוני"
        : "הסכם חתום";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — ${escapeHtml(data.traineeName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #111; line-height: 1.6; }
    .export-page { padding: 2rem; }
    .export-page--break { min-height: 100vh; box-sizing: border-box; }
    .export-page + .export-page { border-top: 1px solid #ddd; }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin: 0.15rem 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: right; vertical-align: top; }
    th { background: #f5f5f5; width: 35%; }
    .agreement { white-space: pre-wrap; background: #fafafa; padding: 1rem; border: 1px solid #ddd; margin-top: 1rem; }
    .signature { margin-top: 1rem; }
    .signature img { max-width: 320px; max-height: 200px; border: 1px solid #ddd; }
    @media print {
      @page { size: A4; margin: 12mm; }
      html, body {
        height: auto !important;
        overflow: visible !important;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .export-page {
        padding: 0;
        border: none;
      }
      .export-page--break {
        page-break-after: always;
        break-after: page;
      }
      h1 { page-break-after: avoid; break-after: avoid-page; }
      table { page-break-inside: auto; break-inside: auto; }
      tr, th, td { page-break-inside: avoid; break-inside: avoid-page; }
      .agreement {
        page-break-inside: auto;
        break-inside: auto;
        overflow: visible !important;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .signature { page-break-inside: avoid; break-inside: avoid-page; }
      .signature img { max-width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body>
  ${pages.join("\n")}
</body>
</html>`;
}
