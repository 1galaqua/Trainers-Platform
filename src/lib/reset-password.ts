import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password";
import {
  combinePhoneParts,
  displayNamesMatch,
  normalizePhone,
  phonesMatch,
  validateInvitePhoneParts,
} from "@/lib/user-identity";

export type ResetPasswordInput = {
  displayName: string;
  email: string;
  phonePrefix: string;
  phoneSuffix: string;
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
  const displayName = input.displayName.trim();
  const password = input.password;
  const confirm = input.confirmPassword;

  if (!email || !displayName || !input.phonePrefix || !input.phoneSuffix) {
    return { error: "יש למלא שם מלא, אימייל ומספר טלפון" };
  }
  if (!password) return { error: "יש להזין סיסמה חדשה" };
  if (password !== confirm) return { error: "הסיסמאות אינן תואמות" };

  const phoneError = validateInvitePhoneParts(input.phonePrefix, input.phoneSuffix);
  if (phoneError) return { error: phoneError };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const phoneNumber = normalizePhone(combinePhoneParts(input.phonePrefix, input.phoneSuffix));

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, displayName: true, phoneNumber: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "חלק מהפרטים שהזנת שגויים" };
  }

  if (
    !displayNamesMatch(user.displayName, displayName) ||
    !phonesMatch(user.phoneNumber, phoneNumber)
  ) {
    return { error: "חלק מהפרטים שהזנת שגויים" };
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
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phonePrefix: String(formData.get("phonePrefix") ?? ""),
    phoneSuffix: String(formData.get("phoneSuffix") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}
