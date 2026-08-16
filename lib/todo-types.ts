// 共用型別：收件匣 + 主清單兩階段 todo app

/** 優先級：0 = 無、1 = 低、2 = 中、3 = 高 */
export type Priority = 0 | 1 | 2 | 3;

/** 主清單裡的一筆任務（可巢狀，支援子彈筆記） */
export interface Todo {
  id: string;
  content: string;
  done: boolean;
  /** null = 頂層項目；否則為父項目 id（子彈筆記用） */
  parentId: string | null;
  createdAt: number;
  /** 截止 / 記錄時間，毫秒 timestamp */
  dueAt: number | null;
  completedAt: number | null;
  /** 提醒時間，毫秒 timestamp */
  remindAt: number | null;
  priority: Priority;
  tags: string[];
  /** 手動排序用（數字小者在前） */
  order: number;
}

/** 從一行文字解析出來的結構（尚未變成 Todo） */
export interface ParsedLine {
  content: string;
  done: boolean;
  dueAt: number | null;
  remindAt: number | null;
  priority: Priority;
  tags: string[];
  /** 是否為上一個頂層項目的子項目（靠縮排判斷） */
  isChild: boolean;
}
