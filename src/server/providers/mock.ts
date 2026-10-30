import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { GarmentAnalysis, ItemInfo, ReelScript } from '../types';
import type { AnalysisProvider, ImageInput, LipSyncProvider, ScriptProvider, TryOnProvider, TtsProvider } from './types';

const run = promisify(execFile);

/** DEMO_MODE providers: deterministic, offline, no API keys. Output is clearly placeholder content. */
export class MockAnalysisProvider implements AnalysisProvider {
  readonly name = 'mock';
  async analyzeGarment(_images: ImageInput[], info: ItemInfo): Promise<GarmentAnalysis> {
    return {
      productName: info.name ?? 'Demo garment',
      category: 'top',
      colors: ['black'],
      material: 'likely cotton',
      style: 'casual chic',
      fit: 'relaxed',
      occasions: ['everyday', 'weekend brunch'],
      sellingPoints: ['easy to style', 'flattering relaxed fit', 'goes with jeans and skirts'],
    };
  }
}

export class MockScriptProvider implements ScriptProvider {
  readonly name = 'mock';
  async writeScript({ analysis, info, language }: { analysis: GarmentAnalysis; info: ItemInfo; language: 'pl' | 'en' }): Promise<ReelScript> {
    const price = info.price !== undefined ? ` ${info.price} ${info.currency ?? ''}`.trimEnd() : '';
    if (language === 'pl') {
      return {
        hook: 'Dziewczyny, STOP! Musicie to zobaczyć!',
        compliments: [
          `${analysis.productName} ma ${analysis.fit} krój, który wygląda po prostu świetnie.`,
          `Kolor ${analysis.colors[0]} pasuje praktycznie do wszystkiego!`,
        ],
        stylingTip: `Załóżcie to na ${analysis.occasions[0]} z prostymi dodatkami.`,
        callToAction: `Link jest pod filmikiem${price ? `, tylko${price}` : ''} — bierzcie, zanim zniknie!`,
        caption: `${analysis.productName} — mój nowy faworyt ✨ (DEMO)`,
        hashtags: ['#moda', '#ootd', '#stylizacja', '#fashion', '#demo'],
      };
    }
    return {
      hook: 'Okay girls, you NEED to see this!',
      compliments: [
        `This ${analysis.productName} has a ${analysis.fit} fit that looks amazing.`,
        `And the ${analysis.colors[0]} goes with literally everything!`,
      ],
      stylingTip: `Wear it for ${analysis.occasions[0]} with simple accessories.`,
      callToAction: `Link below${price ? `, only${price}` : ''} — grab it before it's gone!`,
      caption: `${analysis.productName} — my new favourite ✨ (DEMO)`,
      hashtags: ['#fashion', '#ootd', '#styleinspo', '#outfit', '#demo'],
    };
  }
}

export class MockTryOnProvider implements TryOnProvider {
  readonly name = 'mock';
  async tryOn({ garment, outPath }: { garment: ImageInput; outPath: string }) {
    const target = outPath.replace(/\.[a-z0-9]+$/i, '') + path.extname(garment.path).toLowerCase();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(garment.path, target); // demo: "try-on" is the original photo
    return target;
  }
}

export class MockTtsProvider implements TtsProvider {
  readonly name = 'mock';
  constructor(private ffmpeg = 'ffmpeg') {}
  async synthesize({ text, outPath }: { text: string; outPath: string }) {
    const seconds = Math.min(30, Math.max(5, text.split(/\s+/).length / 2.6));
    const file = outPath.replace(/\.[a-z0-9]+$/i, '') + '.wav';
    await fs.mkdir(path.dirname(file), { recursive: true });
    // Quiet tone so the demo reel has an audio track of realistic length.
    await run(this.ffmpeg, ['-y', '-f', 'lavfi', '-i', `sine=frequency=220:duration=${seconds.toFixed(2)}`, '-af', 'volume=0.05', file]);
    return file;
  }
}

export class NoLipSyncProvider implements LipSyncProvider {
  readonly name = 'none';
  async animate() {
    return null;
  }
}
