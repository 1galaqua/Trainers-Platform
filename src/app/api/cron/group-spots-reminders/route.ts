import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueCalendarReminders } from "@/lib/process-calendar-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groupSpots = await processDueCalendarReminders();
    return NextResponse.json({ ok: true, groupSpots });
  } catch (error) {
    console.error("GET /api/cron/group-spots-reminders:", error);
    return NextResponse.json({ error: "Failed to process group spot reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
