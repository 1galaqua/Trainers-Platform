import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueBodyWeightReminders } from "@/lib/process-body-weight-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bodyWeightReminders = await processDueBodyWeightReminders();
    return NextResponse.json({ ok: true, bodyWeightReminders });
  } catch (error) {
    console.error("GET /api/cron/body-weight-reminders:", error);
    return NextResponse.json({ error: "Failed to process body weight reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
