import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password";
import {
  agesMatch,
  normalizePhone,
  parseAge,
  phonesMatch,
  validatePhone,
} from "@/lib/user-identity";

export type ResetPasswordInput = {
  email: string;
  phoneNumber: string;
  age: string;
  password: string;
  confirmPassword: string;
};

export type ResetPasswordResult =
  | { success: true }
  | { error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function resetPasswordByIdentity(
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const email = normalizeEmail(input.email);
  const phoneRaw = input.phoneNumber.trim();
  const ageRaw = input.age.trim();
  const password = input.password;
  const confirm = input.confirmPassword;

  if (!email || !phoneRaw || !ageRaw) {
    return { error: "יש למלא אימייל, גיל ומספר טלפון" };
  }
  if (!password) return { error: "יש להזין סיסמה חדשה" };
  if (password !== confirm) return { error: "הסיסמאות אינן תואמות" };

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) return { error: phoneError };

  const age = parseAge(ageRaw);
  if (age == null) return { error: "גיל לא תקין (1–120)" };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const phoneNumber = normalizePhone(phoneRaw);

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, phoneNumber: true, age: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "הפרטים לא תואמים לחשבון. בדוק/י אימייל, גיל וטלפון." };
  }

  if (!agesMatch(user.age, age) || !phonesMatch(user.phoneNumber, phoneNumber)) {
    return { error: "הפרטים לא תואמים לחשבון. בדוק/י אימייל, גיל וטלפון." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.user.updateMany({
    where: {
      email,
      id: user.id,
    },
    data: { passwordHash },
  });

  if (updated.count !== 1) {
    return { error: "לא ניתן לעדכן את הסיסמה. נסו שוב." };
  }

  return { success: true };
}

export function resetPasswordInputFromFormData(formData: FormData): ResetPasswordInput {
  return {
    email: String(formData.get("email") ?? ""),
    phoneNumber: String(formData.get("phoneNumber") ?? ""),
    age: String(formData.get("age") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}
