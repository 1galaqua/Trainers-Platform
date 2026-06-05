/** מספרים בלבד — פורמט ישראלי אחיד (050…) */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.length === 9 && digits.startsWith("5")) {
    digits = `0${digits}`;
  }
  return digits;
}

export function phonesMatch(
  stored: string | null | undefined,
  entered: string | null | undefined,
): boolean {
  const a = normalizePhone(stored ?? "");
  const b = normalizePhone(entered ?? "");
  return a.length > 0 && a === b;
}

export function parseAge(raw: string): number | null {
  const age = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(age) || age < 1 || age > 120) return null;
  return age;
}

export function agesMatch(
  stored: number | null | undefined,
  entered: number,
): boolean {
  if (stored == null) return false;
  return Number(stored) === entered;
}

export function validatePhone(phone: string): string | null {
  const digits = normalizePhone(phone);
  if (digits.length < 9 || digits.length > 15) {
    return "מספר טלפון לא תקין";
  }
  return null;
}
