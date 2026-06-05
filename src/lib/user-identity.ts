/** מספרים בלבד — להשוואת טלפון */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function parseAge(raw: string): number | null {
  const age = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(age) || age < 1 || age > 120) return null;
  return age;
}

export function validatePhone(phone: string): string | null {
  const digits = normalizePhone(phone);
  if (digits.length < 9 || digits.length > 15) {
    return "מספר טלפון לא תקין";
  }
  return null;
}
