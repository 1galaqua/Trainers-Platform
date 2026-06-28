import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueUserCalendarEventReminders } from "@/lib/process-user-calendar-event-reminders";
import { processDueUserWorkoutReminders } from "@/lib/process-user-workout-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [userReminders, eventReminders] = await Promise.all([
      processDueUserWorkoutReminders(),
      processDueUserCalendarEventReminders(),
    ]);
    return NextResponse.json({ ok: true, userReminders, eventReminders });
  } catch (error) {
    console.error("GET /api/cron/workout-reminders:", error);
    return NextResponse.json({ error: "Failed to process workout reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
