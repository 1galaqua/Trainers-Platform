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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
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
      error: "שליחת מייל לא מוגדרת (RESEND_API_KEY, EMAIL_FROM)",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Resend error:", response.status, body);
      return { ok: false, error: "שליחת המייל נכשלה" };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendEmail error:", error);
    return { ok: false, error: "שליחת המייל נכשלה" };
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
