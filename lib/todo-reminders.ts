// 瀏覽器通知提醒排程。第一版用 Web Notifications + setTimeout；
// 之後若要可靠的跨裝置推播，再加後端排程。

import type { Todo } from "./todo-types";

// setTimeout 最大延遲約 24.8 天，超過會立即觸發，故設上限。
const MAX_DELAY = 2_000_000_000;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

function fire(todo: Todo) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification("⏰ 提醒", { body: todo.content, tag: todo.id });
  } catch {
    // 某些瀏覽器需要 service worker 才能在背景顯示，這裡靜默略過。
  }
}

/**
 * 依目前的 todos 重新排程所有未來的提醒。
 * 回傳一個清理函式，會清掉這次排的所有 timer。
 */
export function scheduleReminders(
  todos: Todo[],
  onFire?: (todo: Todo) => void,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();

  for (const todo of todos) {
    if (todo.done || todo.remindAt === null) continue;
    const delay = todo.remindAt - now;
    if (delay <= 0 || delay > MAX_DELAY) continue;
    const timer = setTimeout(() => {
      fire(todo);
      onFire?.(todo);
    }, delay);
    timers.push(timer);
  }

  return () => timers.forEach(clearTimeout);
}
