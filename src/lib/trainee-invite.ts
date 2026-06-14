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

export function buildTraineeInviteWhatsAppMessage(coachName: string, url: string): string {
  return `היי 👋
ברוך הבא לפלטפורמת האימונים של ${coachName} 💪

כדי להתחיל את התהליך, יש למלא שאלון קצר, לאשר את הסכם האימונים וליצור את החשבון שלך במערכת.

🔗 קישור להצטרפות:
${url}

🔐 סיסמה ראשונית להתחברות: ${DEFAULT_TRAINEE_PASSWORD}
לאחר הכניסה למערכת מומלץ לעדכן סיסמה אישית. ניתן לעשות זאת בקלות דרך כפתור "שכחתי סיסמה" במסך ההתחברות.

לאחר ההרשמה תוכל להתחיל לעקוב אחרי תוכניות האימון וההתקדמות שלך 📊

${coachName} זמין עבורך לכל שאלה 👍`;
}
