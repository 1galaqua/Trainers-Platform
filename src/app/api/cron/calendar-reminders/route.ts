import { NextResponse } from "next/server";

import { processDueCalendarReminders } from "@/lib/process-calendar-reminders";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueCalendarReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/calendar-reminders:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
