const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

export interface CompressedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  byteLength: number;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const { width: srcW, height: srcH } = bitmap;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH));
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(dstW, dstH)
      : Object.assign(document.createElement("canvas"), {
          width: dstW,
          height: dstH,
        });

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    bitmap.close();
    throw new Error("Failed to get 2D canvas context");
  }
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close();

  const blob: Blob =
    canvas instanceof OffscreenCanvas
      ? await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY })
      : await new Promise<Blob>((resolve, reject) => {
          (canvas as HTMLCanvasElement).toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            JPEG_QUALITY
          );
        });

  const buf = await blob.arrayBuffer();
  return {
    base64: arrayBufferToBase64(buf),
    mimeType: "image/jpeg",
    width: dstW,
    height: dstH,
    byteLength: buf.byteLength,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
