"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { compressImage } from "@/lib/compress";
import type {
  PhotoState,
  RecognizedItem,
  RecognizeResponseBody,
} from "@/lib/types";

interface CategoryGroup {
  category: string;
  items: Array<{ item: RecognizedItem; photoIndex: number }>;
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [running, setRunning] = useState(false);
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
  }, []);

  const clearAll = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
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

    await Promise.all(
      targets.map(async (photo) => {
        try {
          const compressed = await compressImage(photo.file);
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id ? { ...p, status: "recognizing" } : p
            )
          );

          const res = await fetch("/api/recognize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: compressed.base64,
              mimeType: compressed.mimeType,
            }),
          });

          if (!res.ok) {
            const errBody = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(errBody.error ?? `HTTP ${res.status}`);
          }

          const data = (await res.json()) as RecognizeResponseBody;
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, status: "done", items: data.items }
                : p
            )
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id ? { ...p, status: "error", error: message } : p
            )
          );
        }
      })
    );

    setRunning(false);
  }, [photos, running]);

  const grouped = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup["items"]>();
    photos.forEach((photo, photoIndex) => {
      photo.items?.forEach((item) => {
        const key = item.category || "其他";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ item, photoIndex });
      });
    });
    return Array.from(map.entries())
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => b.item.confidence - a.item.confidence),
      }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [photos]);

  const totalItems = grouped.reduce((sum, g) => sum + g.items.length, 0);
  const hasAnyDone = photos.some((p) => p.status === "done");
  const allDone = photos.length > 0 && photos.every((p) => p.status === "done");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          批次拍照 → AI 辨識物品清單
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          一次選多張照片，按下「開始辨識」，AI 會列出每張照片裡的物品。
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
          <h2 className="text-lg font-semibold mb-3">
            合併清單{" "}
            <span className="text-neutral-500 font-normal">
              （共 {totalItems} 項）
            </span>
          </h2>
          {totalItems === 0 ? (
            <p className="text-sm text-neutral-500">沒有辨識到任何物品。</p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div
                  key={group.category}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                >
                  <div className="bg-neutral-50 dark:bg-neutral-900 px-4 py-2 text-sm font-medium flex items-center justify-between">
                    <span>{group.category}</span>
                    <span className="text-neutral-500">{group.items.length}</span>
                  </div>
                  <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {group.items.map(({ item, photoIndex }, i) => (
                      <li
                        key={`${group.category}-${i}`}
                        className="px-4 py-2 flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>照片 #{photoIndex + 1}</span>
                          <span className="tabular-nums">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
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
