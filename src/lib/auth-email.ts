import { getAppUrl } from "@/lib/app-url";
import { createAuthToken } from "@/lib/auth-tokens";
import {
  buildPasswordResetEmail,
  buildVerificationEmail,
  sendEmail,
  type SendEmailResult,
} from "@/lib/email";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export async function sendVerificationEmail(
  userId: string,
  email: string,
): Promise<SendEmailResult> {
  const token = await createAuthToken(userId, "EMAIL_VERIFICATION", VERIFICATION_TTL_MS);
  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = buildVerificationEmail(verifyUrl);
  return sendEmail({ to: email, subject, html, text });
}

export async function sendPasswordResetEmail(
  userId: string,
  email: string,
): Promise<SendEmailResult> {
  const token = await createAuthToken(userId, "PASSWORD_RESET", RESET_TTL_MS);
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = buildPasswordResetEmail(resetUrl);
  return sendEmail({ to: email, subject, html, text });
}
