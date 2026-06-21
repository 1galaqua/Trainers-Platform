export function isAppBadgeSupported() {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

export async function syncAppBadge(unreadCount: number) {
  if (!isAppBadgeSupported()) return;

  try {
    if (unreadCount > 0) {
      await navigator.setAppBadge(unreadCount);
    } else {
      await navigator.clearAppBadge();
    }
  } catch {
    // Badging API is best-effort across platforms.
  }
}
