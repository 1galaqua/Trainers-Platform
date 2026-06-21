/** Session lifetime for coaches, trainees, and admins (local auth). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const SESSION_EXPIRES_IN = "30d";

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
