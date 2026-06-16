import type { QuestionField } from "@/lib/onboarding-template";

export const REQUIRED_FIELD_MESSAGE = "*שדה חובה";

export function isEmptyFormValue(raw: FormDataEntryValue | null): boolean {
  return String(raw ?? "").trim() === "";
}

export function isEmptyNumberFormValue(raw: FormDataEntryValue | null): boolean {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return true;
  return Number.isNaN(Number(trimmed));
}

export function getMissingQuestionnaireFieldKeys(
  formData: FormData,
  fields: QuestionField[],
): string[] {
  const missing: string[] = [];

  for (const field of fields) {
    const raw = formData.get(field.key);
    const isEmpty =
      field.type === "number" ? isEmptyNumberFormValue(raw) : isEmptyFormValue(raw);

    if (isEmpty) {
      missing.push(field.key);
    }
  }

  return missing;
}

export function toFieldErrorMap(keys: string[]): Record<string, true> {
  return Object.fromEntries(keys.map((key) => [key, true as const]));
}

export function isMissingSignature(signature: string): boolean {
  return !signature.startsWith("data:image");
}
