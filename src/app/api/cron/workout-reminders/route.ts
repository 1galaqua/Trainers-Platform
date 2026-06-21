import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueUserWorkoutReminders } from "@/lib/process-user-workout-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userReminders = await processDueUserWorkoutReminders();
    return NextResponse.json({ ok: true, userReminders });
  } catch (error) {
    console.error("GET /api/cron/workout-reminders:", error);
    return NextResponse.json({ error: "Failed to process workout reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
