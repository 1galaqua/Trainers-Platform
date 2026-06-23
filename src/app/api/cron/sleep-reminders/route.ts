import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueSleepReminders } from "@/lib/process-sleep-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sleepReminders = await processDueSleepReminders();
    return NextResponse.json({ ok: true, sleepReminders });
  } catch (error) {
    console.error("GET /api/cron/sleep-reminders:", error);
    return NextResponse.json({ error: "Failed to process sleep reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
