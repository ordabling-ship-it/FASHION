import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { extractJson } from '../providers/util';

export const TrendsSchema = z.object({
  hookStyles: z.array(z.string().min(3)).min(3).max(12),
  hashtags: z.array(z.string().regex(/^#\S+$/)).min(3).max(20),
  themes: z.array(z.string()).max(10).default([]),
});
export type Trends = z.infer<typeof TrendsSchema> & {
  source: 'gemini-search' | 'curated' | 'mock';
  region: string;
  language: 'pl' | 'en';
  fetchedAt: string;
};

export const CURATED_TRENDS: Record<'pl' | 'en', z.infer<typeof TrendsSchema>> = {
  pl: {
    hookStyles: [
      'POV: znalazłaś idealną [rzecz] i nie możesz przestać jej nosić',
      'Nikt mi nie wierzył, że to wygląda TAK dobrze…',
      'Stop scrollowania — to musisz zobaczyć',
      '3 sposoby na stylizację [rzeczy], o których nie wiedziałaś',
      'Ta [rzecz] to mój sekret na [okazja]',
      'Get ready with me: [okazja] w 30 sekund',
    ],
    hashtags: ['#ootd', '#modadamska', '#stylizacja', '#fashiontiktok', '#outfitinspo', '#tiktokmodelka', '#grwm', '#fyp'],
    themes: ['GRWM', 'outfit check', 'styling hacks'],
  },
  en: {
    hookStyles: [
      'POV: you finally found the perfect [item]',
      "Nobody believed me that this looks THIS good…",
      'Stop scrolling — you need to see this',
      "3 ways to style [item] you haven't tried",
      'This [item] is my secret for [occasion]',
      'Get ready with me: [occasion] edition',
    ],
    hashtags: ['#ootd', '#fashiontiktok', '#outfitinspo', '#styleinspo', '#grwm', '#outfitcheck', '#fyp'],
    themes: ['GRWM', 'outfit check', 'styling hacks'],
  },
};

export interface TrendsSource {
  readonly name: Trends['source'];
  fetch(region: string, language: 'pl' | 'en'): Promise<z.infer<typeof TrendsSchema>>;
}

export class GeminiSearchTrendsSource implements TrendsSource {
  readonly name = 'gemini-search' as const;
  private ai: GoogleGenAI;
  constructor(apiKey: string, private model: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }
  async fetch(region: string, language: 'pl' | 'en') {
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: `Use Google Search to find what is trending RIGHT NOW (last 2-4 weeks) on TikTok fashion content in region "${region}".
List the hook formats/openers that top fashion creators currently use in the first 2 seconds (as reusable templates with [item]/[occasion] placeholders, written in ${language === 'pl' ? 'Polish' : 'English'}),
the currently popular fashion hashtags there, and current fashion content themes.
Return ONLY JSON: {"hookStyles": string[5..10], "hashtags": string[6..15] (each starting with #), "themes": string[3..8]}`,
      // Grounding tool cannot be combined with JSON mime type, so the JSON is parsed from text.
      config: { tools: [{ googleSearch: {} }], temperature: 0.4 },
    });
    return TrendsSchema.parse(extractJson(res.text ?? ''));
  }
}

export class StaticTrendsSource implements TrendsSource {
  constructor(readonly name: 'curated' | 'mock') {}
  async fetch(_region: string, language: 'pl' | 'en') {
    return CURATED_TRENDS[language];
  }
}

/** Trends with a 24h file cache (data/trends.json) and a curated fallback. */
export class TrendsService {
  private file: string;
  constructor(
    dataDir: string,
    private source: TrendsSource,
    private ttlMs = 24 * 60 * 60 * 1000,
    private now = () => Date.now(),
  ) {
    this.file = path.join(dataDir, 'trends.json');
  }

  private readCache(): Record<string, Trends> {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      return {};
    }
  }

  async get(region: string, language: 'pl' | 'en'): Promise<Trends> {
    const key = `${region}:${language}`;
    const cache = this.readCache();
    const hit = cache[key];
    if (hit && this.now() - Date.parse(hit.fetchedAt) < this.ttlMs) return hit;
    let trends: Trends;
    try {
      trends = { ...(await this.source.fetch(region, language)), source: this.source.name, region, language, fetchedAt: new Date(this.now()).toISOString() };
    } catch (err: any) {
      console.warn(`[trends] ${this.source.name} failed (${err?.message ?? err}); using curated hooks`);
      // Prefer a stale real result over the curated list; don't cache the fallback for long.
      if (hit) return hit;
      return { ...CURATED_TRENDS[language], source: 'curated', region, language, fetchedAt: new Date(this.now()).toISOString() };
    }
    cache[key] = trends;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(cache, null, 2));
    return trends;
  }
}

export function mergeHashtags(own: string[], trending: string[], max = 15) {
  const norm = (h: string) => (h.startsWith('#') ? h : `#${h}`).replace(/\s+/g, '');
  const out: string[] = [];
  for (const h of [...own.slice(0, 10).map(norm), ...trending.slice(0, 5).map(norm)]) {
    if (!out.some((x) => x.toLowerCase() === h.toLowerCase())) out.push(h);
  }
  return out.slice(0, max);
}
