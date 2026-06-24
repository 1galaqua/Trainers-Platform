import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueCaloriesReminders } from "@/lib/process-calories-reminders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const caloriesReminders = await processDueCaloriesReminders();
    return NextResponse.json({ ok: true, caloriesReminders });
  } catch (error) {
    console.error("GET /api/cron/calories-reminders:", error);
    return NextResponse.json({ error: "Failed to process calories reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
