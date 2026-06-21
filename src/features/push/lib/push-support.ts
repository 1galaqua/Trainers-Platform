export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerPushServiceWorker() {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export async function getCurrentPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}
