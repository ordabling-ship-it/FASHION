import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURATED_TRENDS, GeminiSearchTrendsSource, TrendsService, mergeHashtags, type TrendsSource } from '../src/server/services/trends';
import { scriptPrompt } from '../src/server/providers/prompts';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'trends-'));
const live = { hookStyles: ['POV: [item] that changed my wardrobe', 'Rate this outfit 1-10', 'Wait for the twirl'], hashtags: ['#fallfashion', '#ootd', '#jesiennastylizacja'], themes: ['quiet luxury'] };

afterEach(() => vi.restoreAllMocks());

describe('trends', () => {
  it('caches for 24h in data/trends.json, then refreshes', async () => {
    const dir = tmp();
    const fetch = vi.fn(async () => live);
    let now = Date.parse('2026-10-30T10:00:00Z');
    const svc = new TrendsService(dir, { name: 'gemini-search', fetch } as TrendsSource, 24 * 3600_000, () => now);
    const a = await svc.get('PL', 'pl');
    expect(a.source).toBe('gemini-search');
    expect(a.hashtags).toContain('#fallfashion');
    await svc.get('PL', 'pl');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'trends.json'), 'utf8'))['PL:pl'].region).toBe('PL');
    now += 25 * 3600_000;
    await svc.get('PL', 'pl');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to curated hooks when search fails, and to stale cache if present', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dir = tmp();
    let fail = false;
    let now = 0;
    const src: TrendsSource = { name: 'gemini-search', fetch: async () => { if (fail) throw new Error('quota'); return live; } };
    const svc = new TrendsService(dir, src, 1000, () => now);
    const fresh = new TrendsService(tmp(), { name: 'gemini-search', fetch: async () => { throw new Error('down'); } });
    const fb = await fresh.get('PL', 'pl');
    expect(fb.source).toBe('curated');
    expect(fb.hookStyles).toEqual(CURATED_TRENDS.pl.hookStyles);

    await svc.get('PL', 'pl');
    fail = true;
    now = 5000;
    expect((await svc.get('PL', 'pl')).source).toBe('gemini-search'); // stale real data beats curated
  });

  it('Gemini source uses Google Search grounding and validates JSON', async () => {
    const g = new GeminiSearchTrendsSource('k', 'gemini-test');
    const spy = vi.spyOn((g as any).ai.models, 'generateContent').mockResolvedValue({ text: 'Here you go: ' + JSON.stringify(live) } as any);
    expect(await g.fetch('PL', 'pl')).toMatchObject({ hashtags: live.hashtags });
    const arg = spy.mock.calls[0][0] as any;
    expect(arg.config.tools).toEqual([{ googleSearch: {} }]);
    expect(arg.contents).toMatch(/TikTok/);
    expect(arg.contents).toMatch(/PL/);
  });

  it('feeds trending hooks and hashtags into the script prompt', () => {
    const analysis = { productName: 'Coat', category: 'coat', colors: ['camel'], material: 'wool', style: 'classic', fit: 'oversized', occasions: ['office'], sellingPoints: ['a', 'b', 'c'] };
    const p = scriptPrompt(analysis, {}, 'pl', live);
    expect(p).toMatch(/trending TikTok fashion hook formats/);
    expect(p).toContain('Rate this outfit 1-10');
    expect(p).toContain('#fallfashion');
    expect(p).toMatch(/do not copy verbatim/);
  });

  it('merges hashtags without duplicates and caps the count', () => {
    const m = mergeHashtags(['#OOTD', 'moda', '#style'], ['#ootd', '#fallfashion']);
    expect(m).toEqual(['#OOTD', '#moda', '#style', '#fallfashion']);
    const capped = mergeHashtags(Array.from({ length: 20 }, (_, i) => `#t${i}`), ['#x']);
    expect(capped.length).toBeLessThanOrEqual(15);
    expect(capped).toContain('#x'); // trending tags always get a slot
  });
});
