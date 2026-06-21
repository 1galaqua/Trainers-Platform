"use client";

import { useEffect } from "react";

import { processMyDueWorkoutRemindersAction } from "@/server/actions/workout-reminders";

/** Fallback while the app is open — server cron handles closed-app delivery. */
export const WORKOUT_REMINDER_POLL_MS = 15 * 60 * 1000;

export function WorkoutReminderSync() {
  useEffect(() => {
    let cancelled = false;

    async function processDueReminders() {
      try {
        await processMyDueWorkoutRemindersAction();
      } catch {
        // Best-effort; cron and dashboard entry also process reminders.
      }
    }

    void processDueReminders();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void processDueReminders();
      }
    }, WORKOUT_REMINDER_POLL_MS);

    function handleAppResume() {
      if (!cancelled) void processDueReminders();
    }

    document.addEventListener("visibilitychange", handleAppResume);
    window.addEventListener("focus", handleAppResume);
    window.addEventListener("pageshow", handleAppResume);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleAppResume);
      window.removeEventListener("focus", handleAppResume);
      window.removeEventListener("pageshow", handleAppResume);
    };
  }, []);

  return null;
}
