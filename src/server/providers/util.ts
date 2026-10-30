import fs from 'fs/promises';
import path from 'path';
import type { ImageInput } from './types';

export const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

export function toImageInput(p: string): ImageInput {
  return { path: p, mimeType: MIME_BY_EXT[path.extname(p).toLowerCase()] ?? 'application/octet-stream' };
}

export async function toDataUri(p: string, mime?: string) {
  const buf = await fs.readFile(p);
  const m = mime ?? MIME_BY_EXT[path.extname(p).toLowerCase()] ?? 'application/octet-stream';
  return `data:${m};base64,${buf.toString('base64')}`;
}

export async function downloadTo(url: string, outPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  return outPath;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Extract the first JSON object from a model response (tolerates ```json fences). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model response did not contain JSON');
  return JSON.parse(raw.slice(start, end + 1));
}
