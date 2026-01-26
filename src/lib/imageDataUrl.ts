export type CompressImageOptions = {
  /** Max width/height in px (keeps aspect ratio) */
  maxDimension?: number;
  /** Output quality for JPEG/WEBP (0-1) */
  quality?: number;
  /** Prefer JPEG for clinical photos to keep size low */
  mimeType?: "image/jpeg" | "image/webp";
};

function dataUrlApproxBytes(dataUrl: string) {
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) return 0;
  const b64 = dataUrl.slice(idx + 7);
  // base64 length -> bytes (approx)
  return Math.floor((b64.length * 3) / 4);
}

async function decodeToCanvas(file: File, maxDimension: number) {
  // Prefer createImageBitmap for performance; fallback to <img>
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  let width: number;
  let height: number;
  let source: CanvasImageSource;

  if (bitmap) {
    width = bitmap.width;
    height = bitmap.height;
    source = bitmap;
  } else {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Falha ao ler imagem"));
        el.src = url;
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");

  ctx.drawImage(source, 0, 0, targetW, targetH);

  if (bitmap) bitmap.close();
  return canvas;
}

/**
 * Convert an image File to a compressed Data URL.
 * This prevents large payloads that can fail to reach backend functions.
 */
export async function fileToCompressedDataUrl(
  file: File,
  opts: CompressImageOptions = {}
): Promise<{ dataUrl: string; approxBytes: number }>
{
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.85;
  const mimeType = opts.mimeType ?? "image/jpeg";

  const canvas = await decodeToCanvas(file, maxDimension);
  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { dataUrl, approxBytes: dataUrlApproxBytes(dataUrl) };
}
