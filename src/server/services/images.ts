import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export interface NormalizeOptions {
  maxSide: number; // px, long side
  maxBytes: number;
  format: 'jpeg' | 'webp';
}

const NATIVE = ['.jpg', '.jpeg', '.png', '.webp'];

async function decodeToBuffer(src: string): Promise<Buffer> {
  const buf = await fs.readFile(src);
  const ext = path.extname(src).toLowerCase();
  if (ext === '.heic' || ext === '.heif') {
    // Prebuilt sharp/libvips has no HEVC decoder (patents), so decode HEIC with libheif-js.
    const { default: convert } = await import('heic-convert');
    return Buffer.from(await convert({ buffer: buf, format: 'JPEG', quality: 0.95 }));
  }
  return buf;
}

/** True when the file can be used as-is (supported format, small enough, not too large in pixels, upright). */
export async function needsConversion(src: string, o: NormalizeOptions): Promise<boolean> {
  const ext = path.extname(src).toLowerCase();
  if (!NATIVE.includes(ext)) return true;
  const stat = await fs.stat(src);
  if (stat.size > o.maxBytes) return true;
  const meta = await sharp(src).metadata();
  if ((meta.orientation ?? 1) !== 1) return true;
  return Math.max(meta.width ?? 0, meta.height ?? 0) > o.maxSide;
}

/**
 * Returns a path to an image that is safe for Gemini / VTON / ffmpeg:
 * auto-rotated, long side ≤ maxSide, JPEG/WebP, ≤ maxBytes. The original file is never modified.
 */
export async function normalizeImage(src: string, outDir: string, o: NormalizeOptions): Promise<{ path: string; converted: boolean }> {
  if (!(await needsConversion(src, o))) return { path: src, converted: false };
  const input = await decodeToBuffer(src);
  await fs.mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `${path.basename(src, path.extname(src))}.${o.format === 'jpeg' ? 'jpg' : 'webp'}`);
  let side = o.maxSide;
  let quality = 88;
  for (let i = 0; i < 8; i++) {
    let pipe = sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' });
    pipe = o.format === 'jpeg' ? pipe.jpeg({ quality, mozjpeg: true }) : pipe.webp({ quality });
    const buf = await pipe.toBuffer();
    if (buf.length <= o.maxBytes || i === 7) {
      await fs.writeFile(out, buf);
      return { path: out, converted: true };
    }
    if (quality > 60) quality -= 10;
    else side = Math.round(side * 0.8);
  }
  throw new Error('unreachable');
}
