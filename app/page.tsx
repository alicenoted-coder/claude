"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "@/lib/todo-types";
import {
  PRIORITY_LABEL,
  buildSortedTree,
  loadInbox,
  loadTodos,
  parsedToTodos,
  saveInbox,
  saveTodos,
  genId,
} from "@/lib/todo-store";
import { parseInbox } from "@/lib/todo-parse";
import {
  notificationPermission,
  requestNotificationPermission,
  scheduleReminders,
} from "@/lib/todo-reminders";

const INBOX_PLACEHOLDER = `在這裡自由打字，一行一個任務，不用碰按鈕：

買牛奶
寫週報 @明天 14:00 !remind !p1
  整理數據          ← 縮排兩格 = 子項目
回信 @2026-06-20 #工作
[x] 已完成的事

整理好按下方按鈕，就會送進右邊主清單。`;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function TodoPage() {
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inbox, setInbox] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const [permission, setPermission] = useState<string>("default");

  // 初次掛載：從 localStorage 讀資料（避免 SSR / hydration 不一致）
  useEffect(() => {
    setTodos(loadTodos());
    setInbox(loadInbox());
    setPermission(notificationPermission());
    setMounted(true);
  }, []);

  // todos 變動就存檔 + 重排提醒
  useEffect(() => {
    if (!mounted) return;
    saveTodos(todos);
  }, [todos, mounted]);

  useEffect(() => {
    if (!mounted) return;
    return scheduleReminders(todos);
  }, [todos, mounted]);

  // 收件匣即時存檔
  useEffect(() => {
    if (!mounted) return;
    saveInbox(inbox);
  }, [inbox, mounted]);

  const tree = useMemo(() => buildSortedTree(todos), [todos]);
  const remaining = useMemo(
    () => todos.filter((t) => !t.done).length,
    [todos],
  );

  const appendTodos = useCallback((newTodos: Todo[]) => {
    if (newTodos.length === 0) return;
    setTodos((prev) => [...prev, ...newTodos]);
  }, []);

  // 收件匣 → 主清單（方案 B 的「整理」動作）
  const processInbox = useCallback(() => {
    const lines = parseInbox(inbox);
    if (lines.length === 0) return;
    const startOrder = todos.length;
    appendTodos(parsedToTodos(lines, startOrder));
    setInbox(""); // 整理完清空收件匣
  }, [inbox, todos.length, appendTodos]);

  const handleQuickAdd = useCallback(() => {
    const lines = parseInbox(quickAdd);
    if (lines.length === 0) return;
    appendTodos(parsedToTodos(lines, todos.length));
    setQuickAdd("");
  }, [quickAdd, todos.length, appendTodos]);

  const toggleDone = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              completedAt: !t.done ? Date.now() : null,
            }
          : t,
      ),
    );
  }, []);

  const updateTodo = useCallback((id: string, patch: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    // 連同子項目一起刪
    setTodos((prev) => prev.filter((t) => t.id !== id && t.parentId !== id));
  }, []);

  const addChild = useCallback(
    (parentId: string) => {
      const child: Todo = {
        id: genId(),
        content: "新的子項目",
        done: false,
        parentId,
        createdAt: Date.now(),
        dueAt: null,
        completedAt: null,
        remindAt: null,
        priority: 0,
        tags: [],
        order: todos.length,
      };
      appendTodos([child]);
    },
    [todos.length, appendTodos],
  );

  const askPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  }, []);

  if (!mounted) {
    return (
      <main className="mx-auto max-w-5xl p-6 text-sm opacity-60">載入中…</main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">📝 我的 Todo</h1>
          <p className="text-sm opacity-60">
            收件匣隨手丟 → 整理進主清單。資料存在這台裝置的瀏覽器。
          </p>
        </div>
        {permission !== "granted" && permission !== "unsupported" && (
          <button
            onClick={askPermission}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            🔔 開啟提醒通知
          </button>
        )}
        {permission === "granted" && (
          <span className="text-sm opacity-60">🔔 提醒已開啟</span>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 收件匣 */}
        <section className="flex flex-col">
          <h2 className="mb-2 text-lg font-semibold">📥 收件匣</h2>
          <textarea
            value={inbox}
            onChange={(e) => setInbox(e.target.value)}
            placeholder={INBOX_PLACEHOLDER}
            spellCheck={false}
            className="h-72 w-full resize-y rounded-lg border border-black/15 bg-transparent p-3 font-mono text-sm leading-relaxed outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
          <button
            onClick={processInbox}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            disabled={!inbox.trim()}
          >
            ⬇️ 整理進主清單
          </button>
          <details className="mt-3 text-xs opacity-70">
            <summary className="cursor-pointer select-none">語法說明</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><code>@明天 14:00</code> / <code>@2026-06-20</code>：截止時間</li>
              <li><code>!remind</code>：開啟提醒（用截止時間）</li>
              <li><code>!p1</code> / <code>!p2</code> / <code>!p3</code>：優先級（p1 最高）</li>
              <li><code>#標籤</code>：分類標籤</li>
              <li>每行開頭縮排兩格：變成上一行的子項目</li>
              <li><code>[x]</code> 開頭：標記為已完成</li>
            </ul>
          </details>
        </section>

        {/* 主清單 */}
        <section className="flex flex-col">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">✅ 主清單</h2>
            <span className="text-sm opacity-60">還有 {remaining} 件</span>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd();
              }}
              placeholder="直接新增一筆… (可用 @ ! # 語法)"
              className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            />
            <button
              onClick={handleQuickAdd}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
              disabled={!quickAdd.trim()}
            >
              新增
            </button>
          </div>

          {tree.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-sm opacity-50 dark:border-white/20">
              還沒有任務。從左邊收件匣整理進來，或用上面的欄位新增。
            </p>
          ) : (
            <ul className="space-y-1">
              {tree.map(({ todo, children }) => (
                <li key={todo.id}>
                  <TodoRow
                    todo={todo}
                    onToggle={toggleDone}
                    onUpdate={updateTodo}
                    onDelete={deleteTodo}
                    onAddChild={addChild}
                  />
                  {children.length > 0 && (
                    <ul className="ml-7 mt-1 space-y-1 border-l border-black/10 pl-3 dark:border-white/15">
                      {children.map((child) => (
                        <li key={child.id}>
                          <TodoRow
                            todo={child}
                            onToggle={toggleDone}
                            onUpdate={updateTodo}
                            onDelete={deleteTodo}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="mt-10 text-center text-xs opacity-40">
        本地版本（localStorage）。之後可接 Supabase 做跨裝置雲端同步。
      </footer>
    </main>
  );
}

interface RowProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onAddChild?: (parentId: string) => void;
}

function TodoRow({ todo, onToggle, onUpdate, onDelete, onAddChild }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const next = draft.trim();
    if (next && next !== todo.content) onUpdate(todo.id, { content: next });
    else setDraft(todo.content);
    setEditing(false);
  };

  const overdue =
    !todo.done && todo.dueAt !== null && todo.dueAt < Date.now();

  return (
    <div className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(todo.content);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-black/20 bg-transparent px-1 py-0.5 text-sm outline-none dark:border-white/30"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`cursor-text break-words text-sm ${
              todo.done ? "line-through opacity-40" : ""
            }`}
          >
            {todo.content}
          </span>
        )}

        {/* 標記列：時間、提醒、優先級、標籤 */}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          {todo.dueAt !== null && (
            <span
              className={`rounded px-1.5 py-0.5 ${
                overdue
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-black/5 opacity-70 dark:bg-white/10"
              }`}
            >
              🗓 {formatTime(todo.dueAt)}
              {overdue ? " ·逾期" : ""}
            </span>
          )}
          {todo.remindAt !== null && !todo.done && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
              🔔 {formatTime(todo.remindAt)}
            </span>
          )}
          {todo.priority > 0 && (
            <span
              className={`rounded px-1.5 py-0.5 ${
                todo.priority === 3
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : todo.priority === 2
                    ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                    : "bg-black/5 opacity-70 dark:bg-white/10"
              }`}
            >
              {PRIORITY_LABEL[todo.priority]}優先
            </span>
          )}
          {todo.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-600 dark:text-blue-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 動作：新增子項目、刪除 */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {onAddChild && (
          <button
            onClick={() => onAddChild(todo.id)}
            title="新增子項目"
            className="rounded px-1.5 text-sm hover:bg-black/10 dark:hover:bg-white/15"
          >
            ＋
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          title="刪除"
          className="rounded px-1.5 text-sm text-red-500 hover:bg-red-500/10"
        >
          ×
        </button>
      </div>
    </div>
  );
}
