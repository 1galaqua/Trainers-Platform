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

export function buildTraineeInviteWhatsAppMessage(_coachName: string, url: string): string {
  return `היי 👋

ברוך הבא למסע הכושר שלך 💪

כדי להתחיל, יש לבצע 3 שלבים פשוטים:

1️⃣ להצטרפות, לחץ על הקישור הבא 🔗:
${url}

2️⃣ מלא את השאלון האישי ואשר את הסכם האימונים.

3️⃣ התחבר למערכת באמצעות הסיסמה הראשונית:
🔐 ${DEFAULT_TRAINEE_PASSWORD}

מומלץ לעדכן את הסיסמה לאחר ההתחברות הראשונה. ניתן לעשות זאת בקלות באמצעות כפתור "שכחתי סיסמה" במסך ההתחברות.

בסיום התהליך תוכל:
✅ לצפות בתוכניות האימון שלך
✅ לדווח על אימונים שביצעת
✅ לעקוב אחר ההתקדמות שלך לאורך זמן 📊

זמין עבורך לכל שאלה.`;
}
