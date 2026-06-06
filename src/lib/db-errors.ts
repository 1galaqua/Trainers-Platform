import { Prisma } from "@/lib/prisma-client";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isDbConnectionError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  return (
    message.includes("Server selection timeout") ||
    message.includes("fatal alert") ||
    message.includes("SSL routines") ||
    message.includes("querySrv") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT") ||
    message.includes("Authentication failed") ||
    message.includes("AuthenticationFailed") ||
    lower.includes("bad auth") ||
    lower.includes("scram failure") ||
    lower.includes("prismaclientinitializationerror") ||
    lower.includes("connect econnrefused") ||
    lower.includes("mongo server error")
  );
}

export function dbActionErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return "החשבון לא נמצא.";
    }
  }

  if (isDbConnectionError(error)) {
    const message = getErrorMessage(error);
    if (
      message.includes("Authentication failed") ||
      message.toLowerCase().includes("bad auth")
    ) {
      return "שגיאה בהתחברות למסד הנתונים. ב-Vercel ודאו ש-DATABASE_URL נכון — סיסמת Atlas חייבת להיות מקודדת (למשל 123456?! → 123456%3F%21).";
    }

    return "לא ניתן להתחבר למסד הנתונים. אם נרשמתם מקומית (localhost), נסו לאפס סיסמה באותה כתובת, או ודאו ש-DATABASE_URL מוגדר ב-Vercel.";
  }

  return "שגיאה בעדכון הסיסמה. נסו שוב.";
}
