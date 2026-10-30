import type { GarmentAnalysis, ItemInfo, ReelScript } from '../types';

export interface ImageInput {
  path: string;
  mimeType: string;
}

export interface AnalysisProvider {
  readonly name: string;
  analyzeGarment(images: ImageInput[], info: ItemInfo): Promise<GarmentAnalysis>;
}

export interface ScriptProvider {
  readonly name: string;
  writeScript(args: {
    analysis: GarmentAnalysis;
    info: ItemInfo;
    language: 'pl' | 'en';
  }): Promise<ReelScript>;
}

export interface TryOnProvider {
  readonly name: string;
  /** Writes the try-on image to outPath and returns it. */
  tryOn(args: { garment: ImageInput; analysis?: GarmentAnalysis; outPath: string }): Promise<string>;
}

export interface TtsProvider {
  readonly name: string;
  /** Writes an mp3/wav voiceover to outPath (extension decided by provider) and returns the actual path. */
  synthesize(args: { text: string; language: 'pl' | 'en'; outPath: string }): Promise<string>;
}

export interface LipSyncProvider {
  readonly name: string;
  /** Returns path of a talking video, or null when not available (renderer falls back to still image). */
  animate(args: { imagePath: string; audioPath: string; outPath: string }): Promise<string | null>;
}

export interface Providers {
  analysis: AnalysisProvider;
  script: ScriptProvider;
  tryOn: TryOnProvider;
  tts: TtsProvider;
  lipSync: LipSyncProvider;
}
