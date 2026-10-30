import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { normalizeImage } from '../src/server/services/images';

const opts = { maxSide: 2048, maxBytes: 4_000_000, format: 'jpeg' as const };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));

describe('image normalization (sharp)', () => {
  it('leaves small supported images untouched', async () => {
    const d = tmp();
    const src = path.join(d, 'a.jpg');
    await sharp({ create: { width: 800, height: 1000, channels: 3, background: 'red' } }).jpeg().toFile(src);
    expect(await normalizeImage(src, path.join(d, 'out'), opts)).toEqual({ path: src, converted: false });
  });

  it('downsizes huge images and keeps them under the byte limit; original kept', async () => {
    const d = tmp();
    const src = path.join(d, 'big.png');
    // Random noise so the PNG is genuinely large (> 4 MB).
    const raw = (await import('crypto')).randomBytes(3000 * 4000 * 3);
    await sharp(raw, { raw: { width: 3000, height: 4000, channels: 3 } }).png().toFile(src);
    const before = fs.statSync(src).size;
    expect(before).toBeGreaterThan(4_000_000);
    const r = await normalizeImage(src, path.join(d, 'out'), { ...opts, maxBytes: 1_500_000 });
    expect(r.converted).toBe(true);
    expect(r.path.endsWith('.jpg')).toBe(true);
    const meta = await sharp(r.path).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2048);
    expect(fs.statSync(r.path).size).toBeLessThanOrEqual(1_500_000);
    expect(fs.statSync(src).size).toBe(before);
  });

  it('auto-rotates EXIF-oriented photos', async () => {
    const d = tmp();
    const src = path.join(d, 'rot.jpg');
    await sharp({ create: { width: 400, height: 200, channels: 3, background: 'blue' } }).jpeg().withMetadata({ orientation: 6 }).toFile(src);
    const r = await normalizeImage(src, path.join(d, 'out'), opts);
    const meta = await sharp(r.path).metadata();
    expect([meta.width, meta.height]).toEqual([200, 400]);
  });

  it('converts HEIC to JPEG', async () => {
    const d = tmp();
    const src = path.join(d, 'phone.heic');
    fs.copyFileSync(path.join(__dirname, 'fixtures', 'sample.heic'), src);
    const r = await normalizeImage(src, path.join(d, 'out'), opts);
    expect(r.converted).toBe(true);
    const meta = await sharp(r.path).metadata();
    expect(meta.format).toBe('jpeg');
    expect(Math.max(meta.width!, meta.height!)).toBe(2048);
  });

  it('can output WebP', async () => {
    const d = tmp();
    const src = path.join(d, 'x.heic');
    fs.copyFileSync(path.join(__dirname, 'fixtures', 'sample.heic'), src);
    const r = await normalizeImage(src, path.join(d, 'out'), { ...opts, format: 'webp' });
    expect((await sharp(r.path).metadata()).format).toBe('webp');
  });
});
