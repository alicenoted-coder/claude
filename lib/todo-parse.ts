// 收件匣文字解析器：把純文字「自由輸入」轉成結構化任務。
// 支援語法（皆可省略，純文字也能用）：
//   - [ ] / - [x] / 開頭的 - 或 *      → 項目、完成狀態
//   縮排（兩格以上或 tab）              → 上一個頂層項目的子項目（子彈筆記）
//   @2026-06-16            / @明天      → 截止日期
//   @2026-06-16 14:00      / @今天 09:00 → 截止日期 + 時間
//   !remind                            → 開啟提醒（用截止時間，沒有則預設一小時後）
//   !p1 / !p2 / !p3                    → 優先級（p1 最高）
//   #標籤                              → 標籤

import type { ParsedLine, Priority } from "./todo-types";

const DATE_ABS = /@(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/;
const DATE_REL = /@(today|tomorrow|今天|明天|後天)(?:\s+(\d{1,2}):(\d{2}))?/i;
const PRIORITY = /!p([1-3])\b/i;
const REMIND = /!remind\b/i;
const TAG = /#([^\s#]+)/g;
const BULLET = /^[-*]\s+/;
const CHECKBOX = /^\[([ xX])\]\s*/;

function startOfDay(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

/** 解析相對/絕對日期 token，回傳 timestamp 或 null。會就地把 token 從文字移除。 */
function extractDue(text: string, now: Date): { rest: string; dueAt: number | null } {
  const abs = text.match(DATE_ABS);
  if (abs) {
    const [, y, mo, d, h, mi] = abs;
    const date = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      h ? Number(h) : 9,
      mi ? Number(mi) : 0,
    );
    return { rest: text.replace(DATE_ABS, " "), dueAt: date.getTime() };
  }

  const rel = text.match(DATE_REL);
  if (rel) {
    const [, word, h, mi] = rel;
    const base = startOfDay(now);
    const lower = word.toLowerCase();
    if (lower === "tomorrow" || word === "明天") base.setDate(base.getDate() + 1);
    else if (word === "後天") base.setDate(base.getDate() + 2);
    // today / 今天 不調整
    base.setHours(h ? Number(h) : 9, mi ? Number(mi) : 0, 0, 0);
    return { rest: text.replace(DATE_REL, " "), dueAt: base.getTime() };
  }

  return { rest: text, dueAt: null };
}

function detectIndent(rawLine: string): boolean {
  const leading = rawLine.match(/^(\s*)/)?.[1] ?? "";
  // tab 或 2 個以上空白視為子項目
  return leading.includes("\t") || leading.length >= 2;
}

/** 解析單行（已知是否非空）。 */
export function parseLine(rawLine: string, now: Date = new Date()): ParsedLine | null {
  if (!rawLine.trim()) return null;

  const isChild = detectIndent(rawLine);
  let text = rawLine.trim();

  // 去掉 bullet 標記
  text = text.replace(BULLET, "");

  // 完成狀態
  let done = false;
  const cb = text.match(CHECKBOX);
  if (cb) {
    done = cb[1].toLowerCase() === "x";
    text = text.replace(CHECKBOX, "");
  }

  // 截止時間
  const dueResult = extractDue(text, now);
  text = dueResult.rest;
  const dueAt = dueResult.dueAt;

  // 優先級
  let priority: Priority = 0;
  const pr = text.match(PRIORITY);
  if (pr) {
    const level = Number(pr[1]); // 1 最高
    priority = (4 - level) as Priority; // p1->3, p2->2, p3->1
    text = text.replace(PRIORITY, " ");
  }

  // 提醒
  let remindAt: number | null = null;
  if (REMIND.test(text)) {
    text = text.replace(REMIND, " ");
    remindAt = dueAt ?? now.getTime() + 60 * 60 * 1000; // 預設一小時後
  }

  // 標籤
  const tags: string[] = [];
  let tagMatch: RegExpExecArray | null;
  TAG.lastIndex = 0;
  while ((tagMatch = TAG.exec(text)) !== null) {
    tags.push(tagMatch[1]);
  }
  text = text.replace(TAG, " ");

  const content = text.replace(/\s+/g, " ").trim();
  if (!content) return null;

  return { content, done, dueAt, remindAt, priority, tags, isChild };
}

/** 解析整段收件匣文字成多行結構。 */
export function parseInbox(text: string, now: Date = new Date()): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const raw of text.split("\n")) {
    const parsed = parseLine(raw, now);
    if (parsed) out.push(parsed);
  }
  return out;
}
