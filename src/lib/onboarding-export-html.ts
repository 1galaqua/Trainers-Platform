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

export function buildOnboardingExportHtml(data: OnboardingExportData) {
  const sections: string[] = [];

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

    sections.push(`
  <h2>שאלון ראשוני</h2>
  <p class="meta">הושלם ב-${formatDate(data.questionnaireCompletedAt)}</p>
  <table>${questionnaireRows}</table>`);
  }

  if (
    data.includeAgreement &&
    data.agreementSignedAt &&
    data.signatureUrl &&
    data.agreementText != null
  ) {
    sections.push(`
  <h2>הסכם וחתימה דיגיטלית</h2>
  <p class="meta">נחתם ב-${formatDate(data.agreementSignedAt)}</p>
  <div class="agreement">${escapeHtml(data.agreementText)}</div>
  <div class="signature">
    <p><strong>חתימה:</strong></p>
    <img src="${data.signatureUrl}" alt="חתימת המתאמן" />
  </div>`);
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
    body { font-family: Arial, sans-serif; margin: 2rem; color: #111; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: right; vertical-align: top; }
    th { background: #f5f5f5; width: 35%; }
    .agreement { white-space: pre-wrap; background: #fafafa; padding: 1rem; border: 1px solid #ddd; margin-top: 1rem; }
    .signature { margin-top: 1rem; }
    .signature img { max-width: 320px; border: 1px solid #ddd; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">מתאמן/ית: ${escapeHtml(data.traineeName)}${data.traineeEmail ? ` · ${escapeHtml(data.traineeEmail)}` : ""}</p>
  ${sections.join("\n")}
</body>
</html>`;
}
