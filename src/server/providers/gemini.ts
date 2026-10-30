import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { GarmentAnalysisSchema, ReelScriptSchema, type GarmentAnalysis, type ItemInfo, type ReelScript } from '../types';
import type { AnalysisProvider, ImageInput, ScriptProvider } from './types';
import { analysisPrompt, scriptPrompt } from './prompts';
import { extractJson } from './util';

export class GeminiProvider implements AnalysisProvider, ScriptProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;
  constructor(apiKey: string, private model: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async json(parts: any[]): Promise<unknown> {
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json', temperature: 0.8 },
    });
    return extractJson(res.text ?? '');
  }

  async analyzeGarment(images: ImageInput[], info: ItemInfo): Promise<GarmentAnalysis> {
    const imageParts = await Promise.all(
      images.slice(0, 4).map(async (img) => ({
        inlineData: { mimeType: img.mimeType, data: (await fs.readFile(img.path)).toString('base64') },
      })),
    );
    return GarmentAnalysisSchema.parse(await this.json([...imageParts, { text: analysisPrompt(info) }]));
  }

  async writeScript(args: { analysis: GarmentAnalysis; info: ItemInfo; language: 'pl' | 'en' }): Promise<ReelScript> {
    return ReelScriptSchema.parse(await this.json([{ text: scriptPrompt(args.analysis, args.info, args.language) }]));
  }
}
