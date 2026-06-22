import { CALENDAR_TIMEZONE } from "@/lib/calendar-config";
import {
  getIsraelDateString,
  getIsraelWeekdayIndex,
} from "@/lib/calendar-datetime";
import { notifyUserAboutBodyWeightReminder } from "@/lib/body-weight-reminder-notifications";
import { prisma } from "@/lib/prisma";

function getIsraelHourMinute(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CALENDAR_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .map((part) => [part.type, part.value]);

  const map = Object.fromEntries(parts);
  return {
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function wasSentToday(lastSentAt: Date | null, today: string) {
  if (!lastSentAt) return false;
  return getIsraelDateString(lastSentAt) === today;
}

export async function processDueBodyWeightReminders(now = new Date()) {
  const today = getIsraelDateString(now);
  const weekday = getIsraelWeekdayIndex(today);
  const { hour, minute } = getIsraelHourMinute(now);
  const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const reminders = await prisma.bodyWeightReminder.findMany({
    where: { enabled: true },
    select: {
      id: true,
      traineeId: true,
      daysOfWeek: true,
      timeLocal: true,
      lastSentAt: true,
    },
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    processed += 1;

    if (!reminder.daysOfWeek.includes(weekday)) {
      skipped += 1;
      continue;
    }

    if (reminder.timeLocal !== currentTime) {
      skipped += 1;
      continue;
    }

    if (wasSentToday(reminder.lastSentAt, today)) {
      skipped += 1;
      continue;
    }

    const loggedToday = await prisma.bodyWeightLog.findFirst({
      where: { traineeId: reminder.traineeId, recordedDay: today },
      select: { id: true },
    });

    if (loggedToday) {
      skipped += 1;
      continue;
    }

    const delivered = await notifyUserAboutBodyWeightReminder({
      userId: reminder.traineeId,
      reminderId: reminder.id,
    });

    if (delivered) {
      sent += 1;
      await prisma.bodyWeightReminder.update({
        where: { id: reminder.id },
        data: { lastSentAt: now },
      });
    } else {
      skipped += 1;
    }
  }

  return { processed, sent, skipped };
}
