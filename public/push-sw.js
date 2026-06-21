async function syncAppBadge(unreadCount) {
  if (!("setAppBadge" in navigator)) return;

  try {
    if (unreadCount > 0) {
      await navigator.setAppBadge(unreadCount);
    } else {
      await navigator.clearAppBadge();
    }
  } catch {
    // Best-effort across platforms.
  }
}

async function notifyClientsUnreadCount(unreadCount) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "SYNC_APP_BADGE", unreadCount });
  }
}

self.addEventListener("push", (event) => {
  let payload = {
    title: "עדכון",
    body: "",
    url: "/dashboard/updates",
    tag: "app-update",
    unreadCount: 1,
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const unreadCount =
    typeof payload.unreadCount === "number" && payload.unreadCount > 0
      ? payload.unreadCount
      : 1;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.tag || "app-update",
        renotify: true,
        dir: "rtl",
        lang: "he",
        vibrate: [120, 60, 120],
        data: {
          url: payload.url || "/dashboard/updates",
          unreadCount,
        },
      }),
      syncAppBadge(unreadCount),
      notifyClientsUnreadCount(unreadCount),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const relativeUrl = event.notification.data?.url || "/dashboard/updates";
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (!client.url.startsWith(self.location.origin)) continue;

        if ("focus" in client) {
          const focusPromise = client.focus();
          if ("navigate" in client) {
            return focusPromise.then(() => client.navigate(targetUrl));
          }
          return focusPromise;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
