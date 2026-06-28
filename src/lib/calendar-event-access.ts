import { getCurrentUser } from "@/lib/auth";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";
import type { CalendarEventExportInput } from "@/lib/calendar-event-export";

export async function getCalendarEventExportForUser(
  eventId: string,
): Promise<CalendarEventExportInput | null> {
  const user = await getCurrentUser();
  if (!user || user.role === "ADMIN") return null;

  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, ...notCancelledWhere },
    include: {
      trainee: { select: { displayName: true } },
    },
  });

  if (!event) return null;

  if (user.role === "COACH") {
    if (event.coachId !== user.id) return null;
  } else if (event.traineeId !== user.id) {
    return null;
  }

  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    durationMinutes: event.durationMinutes,
    traineeName: event.trainee?.displayName ?? null,
    notes: event.notes,
  };
}
