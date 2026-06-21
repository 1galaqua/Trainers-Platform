import { NextResponse } from "next/server";

import { cleanupOldNotifications } from "@/lib/cleanup-old-notifications";
import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueCalendarReminders } from "@/lib/process-calendar-reminders";
import { processDueUserWorkoutReminders } from "@/lib/process-user-workout-reminders";

export const runtime = "nodejs";

/** Manual / legacy trigger — runs all cron tasks in one request. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [groupSpots, userReminders, oldNotifications] = await Promise.all([
      processDueCalendarReminders(),
      processDueUserWorkoutReminders(),
      cleanupOldNotifications(),
    ]);
    return NextResponse.json({ ok: true, groupSpots, userReminders, oldNotifications });
  } catch (error) {
    console.error("GET /api/cron/calendar-reminders:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
