/** Server-only env checks (Vercel, local, etc.) */

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

export function getSessionSecret(): string | undefined {
  return process.env.SESSION_SECRET?.trim() || undefined;
}

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export type ServerConfigIssue =
  | "missing_database_url"
  | "missing_session_secret"
  | null;

export function getServerConfigIssue(): ServerConfigIssue {
  if (!getSessionSecret()) return "missing_session_secret";
  if (!getDatabaseUrl()) return "missing_database_url";
  return null;
}

export function serverConfigErrorMessage(issue: ServerConfigIssue): string {
  switch (issue) {
    case "missing_session_secret":
      return "SESSION_SECRET לא מוגדר ב-Vercel. Project Settings → Environment Variables → הוסף מפתח אקראי (למשל openssl rand -base64 32).";
    case "missing_database_url":
      return "DATABASE_URL לא מוגדר ב-Vercel. העתק את connection string מ-MongoDB Atlas ל-Environment Variables.";
    default:
      return "שגיאת הגדרת שרת";
  }
}
