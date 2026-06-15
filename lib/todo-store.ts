// 本地儲存 + 排序邏輯。第一版用 localStorage，之後可換成 Supabase 雲端同步。

import type { ParsedLine, Priority, Todo } from "./todo-types";

const ITEMS_KEY = "todo-app:items:v1";
const INBOX_KEY = "todo-app:inbox:v1";

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(todos));
}

export function loadInbox(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(INBOX_KEY) ?? "";
}

export function saveInbox(text: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INBOX_KEY, text);
}

/** 把一行解析結果變成 Todo。 */
export function lineToTodo(
  line: ParsedLine,
  parentId: string | null,
  order: number,
): Todo {
  const now = Date.now();
  return {
    id: genId(),
    content: line.content,
    done: line.done,
    parentId,
    createdAt: now,
    dueAt: line.dueAt,
    completedAt: line.done ? now : null,
    remindAt: line.remindAt,
    priority: line.priority,
    tags: line.tags,
    order,
  };
}

/** 把整批解析結果（含縮排父子關係）展開成 Todo 陣列。 */
export function parsedToTodos(lines: ParsedLine[], startOrder: number): Todo[] {
  const todos: Todo[] = [];
  let lastTopId: string | null = null;
  let order = startOrder;
  for (const line of lines) {
    const parentId = line.isChild ? lastTopId : null;
    const todo = lineToTodo(line, parentId, order++);
    if (!line.isChild) lastTopId = todo.id;
    todos.push(todo);
  }
  return todos;
}

/** 自動化排序：未完成在前、依優先級、再依最近的時間、最後依手動順序。 */
function compareTodos(a: Todo, b: Todo): number {
  if (a.done !== b.done) return a.done ? 1 : -1;

  if (a.done && b.done) {
    // 已完成：最近完成的排前面
    return (b.completedAt ?? 0) - (a.completedAt ?? 0);
  }

  // 未完成：優先級高者在前
  if (a.priority !== b.priority) return b.priority - a.priority;

  // 再依最近的時間點（截止或提醒，取較早者），沒有時間的排後面
  const at = soonestTime(a);
  const bt = soonestTime(b);
  if (at !== bt) {
    if (at === null) return 1;
    if (bt === null) return -1;
    return at - bt;
  }

  if (a.order !== b.order) return a.order - b.order;
  return a.createdAt - b.createdAt;
}

function soonestTime(t: Todo): number | null {
  const times = [t.dueAt, t.remindAt].filter((x): x is number => x !== null);
  return times.length ? Math.min(...times) : null;
}

export interface TodoNode {
  todo: Todo;
  children: Todo[];
}

/** 建出排序後的樹狀結構（頂層 + 其子項目）。 */
export function buildSortedTree(todos: Todo[]): TodoNode[] {
  const tops = todos.filter((t) => t.parentId === null).sort(compareTodos);
  const childrenOf = (id: string) =>
    todos.filter((t) => t.parentId === id).sort(compareTodos);
  return tops.map((todo) => ({ todo, children: childrenOf(todo.id) }));
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  0: "",
  1: "低",
  2: "中",
  3: "高",
};
