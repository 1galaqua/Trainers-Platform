import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueWaterReminders } from "@/lib/process-water-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const waterReminders = await processDueWaterReminders();
    return NextResponse.json({ ok: true, waterReminders });
  } catch (error) {
    console.error("GET /api/cron/water-reminders:", error);
    return NextResponse.json({ error: "Failed to process water reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
