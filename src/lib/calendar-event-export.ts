export type CalendarEventExportInput = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  traineeName?: string | null;
  notes?: string | null;
};

function formatICSUtc(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatGoogleCalendarDate(date: Date) {
  return formatICSUtc(date);
}

function escapeICSValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function getCalendarEventTitle(event: CalendarEventExportInput) {
  if (event.traineeName) {
    return `${event.title} · ${event.traineeName}`;
  }
  return event.title;
}

export function getCalendarEventDescription(event: CalendarEventExportInput) {
  const parts = ["אירוע ביומן המאמן", event.notes?.trim() || null].filter(Boolean);
  return parts.join("\n");
}

export function buildCalendarEventICSContent(event: CalendarEventExportInput) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(startsAt.getTime() + event.durationMinutes * 60_000);
  const title = getCalendarEventTitle(event);
  const description = getCalendarEventDescription(event);
  const uid = `calendar-event-${event.id}@trainers-platform`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trainers Platform//Calendar//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSUtc(new Date())}`,
    `DTSTART:${formatICSUtc(startsAt)}`,
    `DTEND:${formatICSUtc(endsAt)}`,
    `SUMMARY:${escapeICSValue(title)}`,
    `DESCRIPTION:${escapeICSValue(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarAddEventUrlForCalendarEvent(event: CalendarEventExportInput) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(startsAt.getTime() + event.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: getCalendarEventTitle(event),
    dates: `${formatGoogleCalendarDate(startsAt)}/${formatGoogleCalendarDate(endsAt)}`,
    details: getCalendarEventDescription(event),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function createCalendarEventICSFile(event: CalendarEventExportInput) {
  const content = buildCalendarEventICSContent(event);
  return new File([content], `event-${event.id}.ics`, {
    type: "text/calendar",
  });
}

export function getCalendarEventICSUrl(eventId: string, origin = "") {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/api/calendar/events/${eventId}/calendar.ics`;
}

function isMobileCalendarDevice(userAgent: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

function isAndroidCalendarDevice(userAgent: string) {
  return /Android/i.test(userAgent);
}

async function tryShareCalendarEventICS(
  event: CalendarEventExportInput,
  icsUrl: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  const title = getCalendarEventTitle(event);
  const file = createCalendarEventICSFile(event);

  const fileShare = { files: [file], title };
  if (typeof navigator.canShare !== "function" || navigator.canShare(fileShare)) {
    try {
      await navigator.share(fileShare);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  const urlShare = { url: icsUrl, title };
  if (typeof navigator.canShare !== "function" || navigator.canShare(urlShare)) {
    try {
      await navigator.share(urlShare);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  return false;
}

function openExternalCalendarUrl(url: string) {
  window.location.assign(url);
}

function downloadCalendarEventICSBlob(event: CalendarEventExportInput) {
  const content = buildCalendarEventICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `event-${event.id}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type AddCalendarEventToCalendarResult =
  | "shared"
  | "google-calendar"
  | "ics-opened"
  | "downloaded";

export async function addCalendarEventToExternalCalendar(
  event: CalendarEventExportInput,
  options?: { userAgent?: string; origin?: string },
): Promise<AddCalendarEventToCalendarResult> {
  const userAgent =
    options?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const icsUrl = getCalendarEventICSUrl(event.id, options?.origin);

  if (!isMobileCalendarDevice(userAgent)) {
    downloadCalendarEventICSBlob(event);
    return "downloaded";
  }

  if (await tryShareCalendarEventICS(event, icsUrl)) {
    return "shared";
  }

  if (isAndroidCalendarDevice(userAgent)) {
    openExternalCalendarUrl(buildGoogleCalendarAddEventUrlForCalendarEvent(event));
    return "google-calendar";
  }

  openExternalCalendarUrl(icsUrl);
  return "ics-opened";
}
