import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiProvider } from '../src/server/providers/gemini';
import { MockScriptProvider } from '../src/server/providers/mock';
import { scriptPrompt } from '../src/server/providers/prompts';
import { extractJson } from '../src/server/providers/util';
import { ReelScriptSchema, scriptToText, type GarmentAnalysis } from '../src/server/types';
import { buildCaptionCues } from '../src/server/services/render';

const analysis: GarmentAnalysis = {
  productName: 'Red midi dress',
  category: 'dress',
  colors: ['red'],
  material: 'likely viscose',
  style: 'romantic',
  fit: 'fitted waist, flowy skirt',
  occasions: ['wedding guest', 'date night'],
  sellingPoints: ['flattering waist', 'flowy movement', 'bold colour'],
};

afterEach(() => vi.restoreAllMocks());

describe('analysis + script (Gemini, mocked)', () => {
  it('validates garment analysis JSON from Gemini', async () => {
    const g = new GeminiProvider('test', 'gemini-test');
    const spy = vi.spyOn((g as any).ai.models, 'generateContent').mockResolvedValue({ text: '```json\n' + JSON.stringify(analysis) + '\n```' } as any);
    const fs = await import('fs');
    const os = await import('os');
    const p = `${os.tmpdir()}/garment-${Date.now()}.jpg`;
    fs.writeFileSync(p, 'fake');
    await expect(g.analyzeGarment([{ path: p, mimeType: 'image/jpeg' }], {})).resolves.toEqual(analysis);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('rejects invalid analysis (too few selling points)', async () => {
    const g = new GeminiProvider('test', 'gemini-test');
    vi.spyOn((g as any).ai.models, 'generateContent').mockResolvedValue({ text: JSON.stringify({ ...analysis, sellingPoints: ['x'] }) } as any);
    await expect(g.analyzeGarment([], {})).rejects.toThrow();
  });

  it('script prompt encodes structure, tone, language and no-invention rule', () => {
    const pl = scriptPrompt(analysis, { price: 149, currency: 'PLN' }, 'pl');
    expect(pl).toMatch(/Polish/);
    expect(pl).toMatch(/hook/);
    expect(pl).toMatch(/enthusiastic, energetic, warm, persuasive/);
    expect(pl).toMatch(/NEVER invent facts/);
    expect(pl).toMatch(/149 PLN/);
    expect(scriptPrompt(analysis, {}, 'en')).toMatch(/Do not mention a price/);
  });

  it('mock script is schema-valid and ~20-30s of speech', async () => {
    for (const language of ['pl', 'en'] as const) {
      const s = ReelScriptSchema.parse(await new MockScriptProvider().writeScript({ analysis, info: {}, language }));
      const words = scriptToText(s).split(/\s+/).length;
      expect(words).toBeGreaterThan(25);
      expect(words).toBeLessThan(90);
    }
  });

  it('extractJson tolerates prose around JSON', () => {
    expect(extractJson('Sure! {"a":1} hope that helps')).toEqual({ a: 1 });
  });

  it('caption cues cover the full duration in order', () => {
    const cues = buildCaptionCues('one two three four five six seven eight nine', 9);
    expect(cues[0].start).toBe(0);
    expect(cues.at(-1)!.end).toBeCloseTo(9);
    cues.slice(1).forEach((c, i) => expect(c.start).toBeCloseTo(cues[i].end));
  });
});
