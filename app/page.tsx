"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { compressImage } from "@/lib/compress";
import type {
  PhotoState,
  RecognizedItem,
  RecognizeResponseBody,
} from "@/lib/types";

interface GroupedItem {
  id: string;
  item: RecognizedItem;
  photoIndex: number;
}

interface CategoryGroup {
  category: string;
  items: GroupedItem[];
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedAt, setCopiedAt] = useState<number>(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: PhotoState[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      });
    }
    setPhotos((prev) => [...prev, ...next]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    setSelected((prev) => {
      const next = new Set(prev);
      for (const key of prev) if (key.startsWith(`${id}:`)) next.delete(key);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setSelected(new Set());
  }, []);

  const recognizeAll = useCallback(async () => {
    if (running || photos.length === 0) return;
    setRunning(true);

    setPhotos((prev) =>
      prev.map((p) =>
        p.status === "done" ? p : { ...p, status: "compressing", error: undefined }
      )
    );

    const targets = photos.filter((p) => p.status !== "done");

    const processOne = async (photo: PhotoState) => {
      try {
        const compressed = await compressImage(photo.file);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, status: "recognizing" } : p
          )
        );

        const maxAttempts = 4;
        let lastError = "";
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const res = await fetch("/api/recognize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: compressed.base64,
              mimeType: compressed.mimeType,
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as RecognizeResponseBody;
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photo.id
                  ? { ...p, status: "done", items: data.items }
                  : p
              )
            );
            return;
          }

          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          lastError = errBody.error ?? `HTTP ${res.status}`;

          const isRateLimit =
            res.status === 429 || /\b429\b/.test(lastError);
          const isServerErr =
            res.status >= 500 || /\b5\d\d\b/.test(lastError);
          if ((!isRateLimit && !isServerErr) || attempt === maxAttempts) break;

          const baseMs = isRateLimit ? 7000 : 1500;
          const backoffMs = baseMs * 2 ** (attempt - 1) + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, backoffMs));
        }
        throw new Error(lastError || "Unknown error");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, status: "error", error: message } : p
          )
        );
      }
    };

    const concurrency = 1;
    const queue = [...targets];
    const workers = Array.from(
      { length: Math.min(concurrency, queue.length) },
      async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          await processOne(next);
        }
      }
    );
    await Promise.all(workers);

    setRunning(false);
  }, [photos, running]);

  const grouped = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, GroupedItem[]>();
    photos.forEach((photo, photoIndex) => {
      photo.items?.forEach((item, j) => {
        const cat = item.category || "其他";
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push({
          id: `${photo.id}:${j}`,
          item,
          photoIndex,
        });
      });
    });
    return Array.from(map.entries())
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => b.item.confidence - a.item.confidence),
      }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [photos]);

  const allIds = useMemo(
    () => grouped.flatMap((g) => g.items.map((i) => i.id)),
    [grouped]
  );
  const totalItems = allIds.length;
  const selectedCount = allIds.reduce(
    (n, id) => n + (selected.has(id) ? 1 : 0),
    0
  );
  const allSelected = totalItems > 0 && selectedCount === totalItems;

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size > 0) return new Set();
      return new Set(allIds);
    });
  }, [allIds]);

  const toggleCategory = useCallback((group: CategoryGroup) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = group.items.every((i) => next.has(i.id));
      if (allOn) {
        group.items.forEach((i) => next.delete(i.id));
      } else {
        group.items.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }, []);

  const copySelected = useCallback(async () => {
    if (selectedCount === 0) return;
    const lines: string[] = [];
    for (const group of grouped) {
      for (const { id, item } of group.items) {
        if (!selected.has(id)) continue;
        const brand = item.brand?.trim();
        lines.push(brand ? `${item.name}（${brand}）` : item.name);
      }
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAt(Date.now());
    } catch {
      // Fallback: open a textarea modal? For now, just alert.
      window.prompt("無法自動複製，請手動複製以下內容：", text);
    }
  }, [grouped, selected, selectedCount]);

  const hasAnyDone = photos.some((p) => p.status === "done");
  const allDone = photos.length > 0 && photos.every((p) => p.status === "done");
  const justCopied = copiedAt > 0 && Date.now() - copiedAt < 2000;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10 pb-32">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          家用品盤點 → 二手販售清單
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          拍家裡的東西，AI 列出可販售物品。勾選後複製清單貼到上架平台。
        </p>
      </header>

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={running}
            className="rounded-lg bg-neutral-900 text-white px-4 py-3 text-sm font-medium disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            📷 拍照
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={running}
            className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
          >
            🖼️ 選照片
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {photos.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              已選 {photos.length} 張
            </p>
            <button
              type="button"
              onClick={clearAll}
              disabled={running}
              className="text-sm text-neutral-500 underline disabled:opacity-50"
            >
              全部清除
            </button>
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <PhotoThumb
                key={photo.id}
                photo={photo}
                index={idx}
                onRemove={() => removePhoto(photo.id)}
                disabled={running}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={recognizeAll}
          disabled={running || photos.length === 0 || allDone}
          className="w-full rounded-lg bg-blue-600 text-white px-4 py-4 text-base font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {running
            ? "辨識中…"
            : allDone
            ? "已全部完成"
            : `🤖 開始辨識 (${photos.filter((p) => p.status !== "done").length})`}
        </button>
      </section>

      {hasAnyDone && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="text-lg font-semibold">
              盤點清單{" "}
              <span className="text-neutral-500 font-normal">
                （共 {totalItems} 項）
              </span>
            </h2>
            {totalItems > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm text-blue-600 underline"
              >
                {allSelected ? "全不選" : "全選"}
              </button>
            )}
          </div>
          {totalItems === 0 ? (
            <p className="text-sm text-neutral-500">沒有辨識到可販售的物品。</p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => {
                const groupSelectedCount = group.items.filter((i) =>
                  selected.has(i.id)
                ).length;
                return (
                  <div
                    key={group.category}
                    className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(group)}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 px-4 py-2 text-sm font-medium flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <span className="flex items-center gap-2">
                        <span>{group.category}</span>
                        {groupSelectedCount > 0 && (
                          <span className="text-xs text-blue-600 font-normal">
                            （已選 {groupSelectedCount}）
                          </span>
                        )}
                      </span>
                      <span className="text-neutral-500 font-normal">
                        {group.items.length}
                      </span>
                    </button>
                    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {group.items.map(({ id, item, photoIndex }) => {
                        const isSelected = selected.has(id);
                        const brand = item.brand?.trim();
                        return (
                          <li
                            key={id}
                            className={`px-3 py-2 flex items-center gap-3 text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-950/40"
                                : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                            }`}
                            onClick={() => toggleOne(id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 accent-blue-600 flex-shrink-0"
                              aria-label={`選 ${item.name}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {item.name}
                              </div>
                              {brand && (
                                <div className="text-xs text-neutral-500 truncate">
                                  {brand}
                                </div>
                              )}
                            </div>
                            <span className="flex items-center gap-2 text-xs text-neutral-500 flex-shrink-0">
                              <span>#{photoIndex + 1}</span>
                              <span className="tabular-nums">
                                {(item.confidence * 100).toFixed(0)}%
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {hasAnyDone && totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur px-4 py-3">
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">
              已勾選{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {selectedCount}
              </span>{" "}
              / {totalItems} 項
            </div>
            <button
              type="button"
              onClick={copySelected}
              disabled={selectedCount === 0}
              className="rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
            >
              {justCopied ? "✓ 已複製" : `📋 複製勾選 (${selectedCount})`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function PhotoThumb({
  photo,
  index,
  onRemove,
  disabled,
}: {
  photo: PhotoState;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const statusLabel = {
    pending: "",
    compressing: "壓縮中",
    recognizing: "辨識中",
    done: `${photo.items?.length ?? 0} 項`,
    error: "失敗",
  }[photo.status];

  const statusClass = {
    pending: "bg-neutral-900/60 text-white",
    compressing: "bg-amber-500/80 text-white",
    recognizing: "bg-blue-600/80 text-white",
    done: "bg-emerald-600/80 text-white",
    error: "bg-red-600/80 text-white",
  }[photo.status];

  return (
    <div className="relative aspect-square rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-900 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt={`photo-${index + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-black/60 text-white">
        #{index + 1}
      </div>
      {statusLabel && (
        <div
          className={`absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] rounded ${statusClass}`}
        >
          {statusLabel}
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="移除"
        >
          ✕
        </button>
      )}
      {photo.status === "error" && photo.error && (
        <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] bg-red-600/90 text-white truncate">
          {photo.error}
        </div>
      )}
    </div>
  );
}
