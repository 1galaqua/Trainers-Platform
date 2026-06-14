import { getAppUrl } from "@/lib/app-url";

export const DEFAULT_TRAINEE_PASSWORD = "123456Aa";

export const INVITE_EXPIRY_DAYS = 30;

export function buildInviteUrl(token: string): string {
  return `${getAppUrl()}/invite/${token}`;
}

export function getInviteExpiryDate(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}
