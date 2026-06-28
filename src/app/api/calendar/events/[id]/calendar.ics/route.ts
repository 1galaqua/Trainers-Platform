import { NextResponse } from "next/server";

import { buildCalendarEventICSContent } from "@/lib/calendar-event-export";
import { getCalendarEventExportForUser } from "@/lib/calendar-event-access";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const event = await getCalendarEventExportForUser(id);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = buildCalendarEventICSContent(event);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="event-${id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
