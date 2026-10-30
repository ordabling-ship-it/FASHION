import fs from 'fs/promises';
import path from 'path';

export const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

export function isImage(file: string) {
  return IMAGE_EXTS.includes(path.extname(file).toLowerCase());
}

export function slugify(s: string) {
  return (
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

/**
 * Item key for a file relative to the input dir:
 *  - "red-dress/front.jpg"        -> "red-dress"   (subfolder = item)
 *  - "red-dress_front.jpg"        -> "red-dress"   (prefix before the last "_")
 *  - "jacket.jpg"                 -> "jacket"
 * Returns null for non-images and anything under processed/.
 */
export function itemKeyFor(relPath: string): string | null {
  const parts = relPath.split(/[\\/]/).filter(Boolean);
  if (parts.length === 0 || parts[0] === 'processed' || parts.some((p) => p.startsWith('.'))) return null;
  if (!isImage(relPath)) return null;
  if (parts.length > 1) return slugify(parts[0]);
  const base = path.basename(parts[0], path.extname(parts[0]));
  const idx = base.lastIndexOf('_');
  return slugify(idx > 0 ? base.slice(0, idx) : base);
}

export function groupFiles(relPaths: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const rel of [...relPaths].sort()) {
    const key = itemKeyFor(rel);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), rel]);
  }
  return groups;
}

export async function listFilesRecursive(dir: string, base = dir): Promise<string[]> {
  let entries: import('fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (path.relative(base, full) === 'processed') continue;
      out.push(...(await listFilesRecursive(full, base)));
    } else out.push(path.relative(base, full));
  }
  return out;
}

/** Optional item metadata: input/<item>/info.json or input/<item>.json → {name, price, currency, language, notes}. */
export async function readItemInfoRaw(inputDir: string, key: string, rels: string[]): Promise<unknown> {
  const candidates = new Set<string>();
  for (const rel of rels) {
    const parts = rel.split(/[\\/]/);
    if (parts.length > 1) candidates.add(path.join(inputDir, parts[0], 'info.json'));
  }
  candidates.add(path.join(inputDir, `${key}.json`));
  for (const c of candidates) {
    try {
      return JSON.parse(await fs.readFile(c, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  return {};
}
