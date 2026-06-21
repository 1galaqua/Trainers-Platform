import { NextResponse } from "next/server";

import { cleanupOldNotifications } from "@/lib/cleanup-old-notifications";
import { isCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oldNotifications = await cleanupOldNotifications();
    return NextResponse.json({ ok: true, oldNotifications });
  } catch (error) {
    console.error("GET /api/cron/cleanup-notifications:", error);
    return NextResponse.json({ error: "Failed to cleanup notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
