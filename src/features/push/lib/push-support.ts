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

export async function getPushServiceWorkerRegistration() {
  if (!isPushSupported()) return null;

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function registerPushServiceWorker() {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/push-sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export async function getCurrentPushSubscription() {
  const registration = await getPushServiceWorkerRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}
