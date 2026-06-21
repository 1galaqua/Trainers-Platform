self.addEventListener("push", (event) => {
  let payload = { title: "עדכון", body: "", url: "/dashboard/updates", tag: "app-update" };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "app-update",
      renotify: true,
      dir: "rtl",
      lang: "he",
      vibrate: [120, 60, 120],
      data: { url: payload.url || "/dashboard/updates" },
    }),
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
