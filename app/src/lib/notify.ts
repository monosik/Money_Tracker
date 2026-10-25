export type NotifState = 'unsupported' | 'default' | 'denied' | 'granted';

export const notifState = (): NotifState =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

export async function requestNotif(): Promise<NotifState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return notifState();
  }
}

export async function showReminder() {
  const opts: NotificationOptions = {
    body: 'Did you spend anything today? Tap to log it.',
    tag: 'daily-reminder',
    icon: './icon-192.png',
    data: { url: './?quickadd=1' },
  };
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (reg) await reg.showNotification('Money Tracker', opts);
  else new Notification('Money Tracker', opts);
}

/** Milliseconds from now until `hhmm` today, or null when that time has passed. */
export function msUntil(hhmm: string, now = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const ms = at.getTime() - now.getTime();
  return ms > 0 ? ms : null;
}
