import type { AppConfig } from '../config';
import type { Providers } from './types';
import { GeminiProvider } from './gemini';
import { FalLipSyncProvider, FalTryOnProvider } from './fal';
import { ReplicateTryOnProvider } from './replicate';
import { ElevenLabsTtsProvider } from './elevenlabs';
import { MockAnalysisProvider, MockScriptProvider, MockTryOnProvider, MockTtsProvider, NoLipSyncProvider } from './mock';

import { GeminiSearchTrendsSource, StaticTrendsSource } from '../services/trends';

export * from './types';

export function createProviders(c: AppConfig): Providers {
  if (c.DEMO_MODE) {
    return {
      analysis: new MockAnalysisProvider(),
      script: new MockScriptProvider(),
      tryOn: new MockTryOnProvider(),
      tts: new MockTtsProvider(c.FFMPEG_PATH),
      lipSync: new NoLipSyncProvider(),
      trends: new StaticTrendsSource('mock'),
    };
  }
  const gemini = new GeminiProvider(c.GEMINI_API_KEY!, c.GEMINI_MODEL);
  const tryOn =
    c.VTON_PROVIDER === 'fal'
      ? new FalTryOnProvider(c.FAL_KEY!, c.FAL_VTON_MODEL, c.MODEL_AVATAR_PATH!)
      : c.VTON_PROVIDER === 'replicate'
        ? new ReplicateTryOnProvider(c.REPLICATE_API_TOKEN!, c.REPLICATE_VTON_MODEL, c.MODEL_AVATAR_PATH!)
        : new MockTryOnProvider();
  const tts = c.TTS_PROVIDER === 'elevenlabs'
    ? new ElevenLabsTtsProvider(c.ELEVENLABS_API_KEY!, c.ELEVENLABS_VOICE_ID, c.ELEVENLABS_MODEL_ID)
    : new MockTtsProvider(c.FFMPEG_PATH);
  const lipSync = c.LIPSYNC_PROVIDER === 'fal' ? new FalLipSyncProvider(c.FAL_KEY!, c.FAL_LIPSYNC_MODEL) : new NoLipSyncProvider();
  const trends = new GeminiSearchTrendsSource(c.GEMINI_API_KEY!, c.GEMINI_MODEL);
  return { analysis: gemini, script: gemini, tryOn, tts, lipSync, trends };
}
