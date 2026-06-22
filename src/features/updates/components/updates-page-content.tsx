"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PushNotificationSettings } from "@/features/push/components/push-notification-settings";
import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { buildCalendarWorkoutUrl } from "@/lib/calendar-navigation";
import { isNotificationUnread } from "@/lib/notification-prisma-filters";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationItem,
} from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

type UpdatesPageContentProps = {
  notifications: NotificationItem[];
};

export function UpdatesPageContent({ notifications }: UpdatesPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const unreadCount = notifications.filter(
    (notification) =>
      isNotificationUnread(notification.readAt) && !readIds.has(notification.id),
  ).length;

  function isUnread(notification: NotificationItem) {
    return isNotificationUnread(notification.readAt) && !readIds.has(notification.id);
  }

  async function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setReadIds(new Set(notifications.map((notification) => notification.id)));
      router.refresh();
    });
  }

  async function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationReadAction(notificationId);
      setReadIds((current) => new Set([...current, notificationId]));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">עדכונים</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            הודעות על אימונים, תזכורות והתראות מהמאמן. עדכונים נמחקים אוטומטית לאחר 7 ימים.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleMarkAllRead}
          >
            סמן {unreadCount} עדכונים כנקראו
          </Button>
        )}
      </div>

      <PushNotificationSettings />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bell className="size-10 text-muted-foreground/60" aria-hidden />
            <p className="font-medium text-sm">אין עדכונים</p>
            <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
              כאן יופיעו הודעות על אימונים והתראות מהמאמן. הודעות Push יישלחו גם למכשיר שלך.
            </p>
            <Button render={<Link href="/dashboard/calendar" />} variant="outline" size="sm">
              <CalendarDays className="size-4" aria-hidden />
              מעבר ליומן
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const unread = isUnread(notification);

            return (
              <li key={notification.id}>
                <Card
                  className={cn(
                    unread &&
                      "cursor-pointer border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10",
                  )}
                  onClick={() => {
                    if (!unread || isPending) return;
                    void handleMarkRead(notification.id);
                  }}
                  onKeyDown={(event) => {
                    if (!unread || isPending) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void handleMarkRead(notification.id);
                    }
                  }}
                  role={unread ? "button" : undefined}
                  tabIndex={unread ? 0 : undefined}
                  aria-label={unread ? `סמן את "${notification.title}" כנקרא` : undefined}
                >
                  <CardContent className="space-y-2 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {unread && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleMarkRead(notification.id);
                          }}
                          className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          חדש
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {notification.body}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-muted-foreground text-xs">
                        {formatWorkoutDateTime(new Date(notification.createdAt))}
                      </p>
                      {notification.type === "BODY_WEIGHT_REMINDER" && (
                        <Button
                          render={<Link href="/dashboard/body-weight?log=1" />}
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (unread && !isPending) {
                              void handleMarkRead(notification.id);
                            }
                          }}
                        >
                          עדכון משקל
                        </Button>
                      )}
                      {notification.workoutId && (
                        <Button
                          render={
                            <Link href={buildCalendarWorkoutUrl(notification.workoutId)} />
                          }
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (unread && !isPending) {
                              void handleMarkRead(notification.id);
                            }
                          }}
                        >
                          מעבר ליומן
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
