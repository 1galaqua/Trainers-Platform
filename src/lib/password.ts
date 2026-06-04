/** 8–16 תווים: אות קטנה, אות גדולה, ספרה; סימנים מיוחדים אופציונליים */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]{8,16}$/;

export const PASSWORD_HINT =
  "8–16 תווים: לפחות אות קטנה באנגלית, אות גדולה וספרה. ניתן להוסיף סימן מיוחד.";

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 16) {
    return "הסיסמה חייבת להיות באורך 8–16 תווים";
  }
  if (!/[a-z]/.test(password)) {
    return "הסיסמה חייבת לכלול לפחות אות קטנה באנגלית (a-z)";
  }
  if (!/[A-Z]/.test(password)) {
    return "הסיסמה חייבת לכלול לפחות אות גדולה באנגלית (A-Z)";
  }
  if (!/\d/.test(password)) {
    return "הסיסמה חייבת לכלול לפחות ספרה אחת";
  }
  if (!PASSWORD_REGEX.test(password)) {
    return "הסיסמה מכילה תווים שאינם מורשים";
  }
  return null;
}
