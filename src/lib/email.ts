import { siteConfig } from "@/config/site";
import { getAppUrl } from "@/lib/app-url";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; dev?: boolean; previewUrl?: string }
  | { ok: false; error: string };

function formatFromAddress(from: string): string {
  const trimmed = from.trim();
  if (trimmed.includes("<")) return trimmed;
  return `${siteConfig.shortName} <${trimmed}>`;
}

function mapResendError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string };
    const msg = String(json.message ?? "");

    if (
      msg.includes("only send testing emails to your own email") ||
      msg.includes("verify a domain")
    ) {
      return (
        "במצב בדיקה (onboarding@resend.dev) אפשר לשלוח רק לכתובת האימייל שממנה נרשמתם ב-Resend. " +
        "לבדיקה: הזינו את trainersplatformapp@gmail.com. לפרודקשן: אמתו דומיין ב-resend.com/domains."
      );
    }

    if (status === 401 || status === 403) {
      return "מפתח Resend לא תקין. בדוק/י את RESEND_API_KEY ב-Vercel והפעילו Deploy מחדש.";
    }

    if (msg) return `שליחת המייל נכשלה: ${msg}`;
  } catch {
    // ignore JSON parse errors
  }

  return `שליחת המייל נכשלה (קוד ${status}). בדוק/י RESEND_API_KEY ו-EMAIL_FROM ב-Vercel.`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !fromRaw) {
    if (process.env.NODE_ENV === "development") {
      const previewUrl = extractFirstUrl(input.text) ?? extractFirstUrl(input.html);
      console.info("[email:dev]", {
        to: input.to,
        subject: input.subject,
        previewUrl,
        text: input.text,
      });
      return { ok: true, dev: true, previewUrl: previewUrl ?? undefined };
    }
    return {
      ok: false,
      error:
        "שליחת מייל לא מוגדרת בשרת. הוסיפו RESEND_API_KEY ו-EMAIL_FROM ב-Vercel ועשו Redeploy.",
    };
  }

  const from = formatFromAddress(fromRaw);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to.trim()],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Resend error:", response.status, body, { from, to: input.to });
      return { ok: false, error: mapResendError(response.status, body) };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendEmail error:", error);
    return { ok: false, error: "שגיאת רשת בשליחת המייל. נסה/י שוב בעוד רגע." };
  }
}

function extractFirstUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/);
  return match?.[0] ?? null;
}

export function buildVerificationEmail(verifyUrl: string) {
  const subject = "אימות כתובת האימייל";
  const text = `שלום,\n\nלאימות החשבון לחץ/י על הקישור:\n${verifyUrl}\n\nהקישור תקף ל-24 שעות.\n\n${getAppUrl()}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>אימות כתובת האימייל</h2>
      <p>שלום,</p>
      <p>כדי להשלים את ההרשמה, יש לאמת את כתובת האימייל:</p>
      <p><a href="${verifyUrl}">לחץ/י לאימות האימייל</a></p>
      <p style="color:#555;font-size:14px">הקישור תקף ל-24 שעות. אם לא ביקשת הרשמה — ניתן להתעלם ממייל זה.</p>
    </div>`;
  return { subject, text, html };
}

export function buildPasswordResetEmail(resetUrl: string) {
  const subject = "איפוס סיסמה";
  const text = `שלום,\n\nלאיפוס הסיסמה לחץ/י על הקישור:\n${resetUrl}\n\nהקישור תקף לשעה.\n\n${getAppUrl()}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>איפוס סיסמה</h2>
      <p>התקבלה בקשה לאיפוס הסיסמה.</p>
      <p><a href="${resetUrl}">לחץ/י לבחירת סיסמה חדשה</a></p>
      <p style="color:#555;font-size:14px">הקישור תקף לשעה. אם לא ביקשת איפוס — התעלם/י ממייל זה.</p>
    </div>`;
  return { subject, text, html };
}
