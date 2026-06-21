export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (secret && authorization === `Bearer ${secret}`) {
    return true;
  }

  if (process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  return false;
}
