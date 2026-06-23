import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueMeasurementsReminders } from "@/lib/process-measurements-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const measurementsReminders = await processDueMeasurementsReminders();
    return NextResponse.json({ ok: true, measurementsReminders });
  } catch (error) {
    console.error("GET /api/cron/measurements-reminders:", error);
    return NextResponse.json({ error: "Failed to process measurements reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
