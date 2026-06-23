import { CALENDAR_TIMEZONE } from "@/lib/calendar-config";
import {
  getIsraelDateString,
  getIsraelWeekdayIndex,
} from "@/lib/calendar-datetime";
import { notifyUserAboutWaterReminder } from "@/lib/tracking-reminder-notifications";
import { prisma } from "@/lib/prisma";

type LastSentSlots = Record<string, string[]>;

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

function parseLastSentSlots(value: unknown): LastSentSlots {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as LastSentSlots;
}

function wasSlotSentToday(lastSentSlots: LastSentSlots, today: string, time: string) {
  const slots = lastSentSlots[today];
  return Array.isArray(slots) && slots.includes(time);
}

function mergeSentSlot(lastSentSlots: LastSentSlots, today: string, time: string): LastSentSlots {
  const existing = Array.isArray(lastSentSlots[today]) ? lastSentSlots[today] : [];
  return { ...lastSentSlots, [today]: [...new Set([...existing, time])] };
}

export async function processDueWaterReminders(now = new Date()) {
  const today = getIsraelDateString(now);
  const weekday = getIsraelWeekdayIndex(today);
  const { hour, minute } = getIsraelHourMinute(now);
  const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const reminders = await prisma.waterReminder.findMany({
    where: { enabled: true },
    select: {
      id: true,
      traineeId: true,
      daysOfWeek: true,
      timesLocal: true,
      lastSentSlots: true,
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

    const timesLocal = reminder.timesLocal.length > 0 ? reminder.timesLocal : [];
    if (!timesLocal.includes(currentTime)) {
      skipped += 1;
      continue;
    }

    const lastSentSlots = parseLastSentSlots(reminder.lastSentSlots);
    if (wasSlotSentToday(lastSentSlots, today, currentTime)) {
      skipped += 1;
      continue;
    }

    const loggedToday = await prisma.waterLog.findFirst({
      where: { traineeId: reminder.traineeId, recordedDay: today },
      select: { id: true },
    });

    if (loggedToday) {
      skipped += 1;
      continue;
    }

    const delivered = await notifyUserAboutWaterReminder({
      userId: reminder.traineeId,
      reminderId: reminder.id,
      timeSlot: currentTime,
    });

    if (delivered) {
      sent += 1;
      await prisma.waterReminder.update({
        where: { id: reminder.id },
        data: { lastSentSlots: mergeSentSlot(lastSentSlots, today, currentTime) },
      });
    } else {
      skipped += 1;
    }
  }

  return { processed, sent, skipped };
}
