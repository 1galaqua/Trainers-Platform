import { NextResponse } from "next/server";

import { buildWorkoutICSContent } from "@/lib/workout-calendar-export";
import { getWorkoutCalendarExportForUser } from "@/lib/workout-calendar-access";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const workout = await getWorkoutCalendarExportForUser(id);

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = buildWorkoutICSContent(workout);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="workout-${id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
