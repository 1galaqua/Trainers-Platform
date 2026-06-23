import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueStepsReminders } from "@/lib/process-steps-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stepsReminders = await processDueStepsReminders();
    return NextResponse.json({ ok: true, stepsReminders });
  } catch (error) {
    console.error("GET /api/cron/steps-reminders:", error);
    return NextResponse.json({ error: "Failed to process steps reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
