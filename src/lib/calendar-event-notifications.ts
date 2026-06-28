import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { filterUsersWithoutRecentDuplicateEventNotification } from "@/lib/calendar-event-notification-dedupe";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationsToUsers } from "@/lib/push-send";
import { revalidateNotifications } from "@/lib/revalidate-tags";
import type { CalendarEvent } from "@/lib/prisma-client";

type CalendarEventNotificationContext = Pick<
  CalendarEvent,
  "id" | "coachId" | "title" | "startsAt" | "durationMinutes"
>;

function formatEventSummary(event: CalendarEventNotificationContext) {
  const when = formatWorkoutDateTime(event.startsAt);
  return `${event.title} · ${when} · ${event.durationMinutes} דק׳`;
}

async function deliverEventNotificationToUser(
  userId: string,
  data: {
    type: "EVENT_SCHEDULED" | "EVENT_UPDATED" | "EVENT_CANCELLED";
    title: string;
    body: string;
    eventId: string;
  },
) {
  await prisma.appNotification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: { eventId: data.eventId },
    },
  });

  try {
    const unreadCount = await getUnreadNotificationCountForUser(userId);
    const subscriptions = await prisma.pushSubscription.count({
      where: { userId },
    });

    if (subscriptions > 0) {
      await sendPushNotificationsToUsers([userId], {
        title: data.title,
        body: data.body,
        url: "/dashboard/updates",
        tag: `event-${data.type.toLowerCase()}-${data.eventId}`,
        unreadCount,
      });
    }
  } catch (error) {
    console.error("[push] calendar event notification delivery failed:", error);
  }

  try {
    revalidateNotifications(userId);
  } catch {
    // revalidateTag requires a Next.js request context.
  }
}

export async function notifyTraineeAboutEventScheduled(params: {
  event: CalendarEventNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.event.coachId) return;

  const summary = formatEventSummary(params.event);

  await deliverEventNotificationToUser(params.traineeId, {
    type: "EVENT_SCHEDULED",
    title: "נקבע לך אירוע",
    body: `נקבע לך אירוע: ${summary}`,
    eventId: params.event.id,
  });
}

export async function notifyTraineeAboutEventUpdated(params: {
  event: CalendarEventNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.event.coachId) return;

  const summary = formatEventSummary(params.event);

  await deliverEventNotificationToUser(params.traineeId, {
    type: "EVENT_UPDATED",
    title: "עודכן אירוע",
    body: `עודכן אירוע: ${summary}`,
    eventId: params.event.id,
  });
}

export async function notifyTraineeAboutEventCancelled(params: {
  event: CalendarEventNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.event.coachId) return;

  const summary = formatEventSummary(params.event);

  await deliverEventNotificationToUser(params.traineeId, {
    type: "EVENT_CANCELLED",
    title: "אירוע בוטל",
    body: `האירוע בוטל: ${summary}`,
    eventId: params.event.id,
  });
}

export async function notifyUserAboutCalendarEventReminder(params: {
  userId: string;
  event: CalendarEventNotificationContext;
}): Promise<boolean> {
  const recipients = await filterUsersWithoutRecentDuplicateEventNotification(
    [params.userId],
    "EVENT_REMINDER",
    params.event.id,
  );

  if (recipients.length === 0) return false;

  const body = formatEventSummary(params.event);

  await prisma.appNotification.create({
    data: {
      userId: params.userId,
      type: "EVENT_REMINDER",
      title: "תזכורת: אירוע בקרוב",
      body,
      payload: { eventId: params.event.id },
    },
  });

  try {
    const unreadCount = await getUnreadNotificationCountForUser(params.userId);
    const subscriptions = await prisma.pushSubscription.count({
      where: { userId: params.userId },
    });

    if (subscriptions > 0) {
      await sendPushNotificationsToUsers([params.userId], {
        title: "תזכורת: אירוע בקרוב",
        body,
        url: "/dashboard/updates",
        tag: `event-reminder-${params.event.id}`,
        unreadCount,
      });
    }
  } catch (error) {
    console.error("[push] calendar event reminder delivery failed:", error);
  }

  try {
    revalidateNotifications(params.userId);
  } catch {
    // revalidateTag requires a Next.js request context.
  }

  return true;
}
