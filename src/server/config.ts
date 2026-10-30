import 'dotenv/config';
import path from 'path';
import { z } from 'zod';

const bool = (def: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? def : v === 'true' || v === '1'));

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DEMO_MODE: bool(true),

    INPUT_DIR: z.string().default('./input'),
    OUTPUT_DIR: z.string().default('./output'),
    DATA_DIR: z.string().default('./data'),
    WATCH_INPUT: bool(true),
    REVIEW_BEFORE_RENDER: bool(false),
    MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),

    REEL_LANGUAGE: z.enum(['pl', 'en']).default('pl'),
    DEFAULT_CURRENCY: z.string().default('PLN'),

    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

    VTON_PROVIDER: z.enum(['fal', 'replicate', 'mock']).default('fal'),
    FAL_KEY: z.string().optional(),
    FAL_VTON_MODEL: z.string().default('fal-ai/cat-vton'),
    REPLICATE_API_TOKEN: z.string().optional(),
    REPLICATE_VTON_MODEL: z
      .string()
      .default('cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985'),
    MODEL_AVATAR_PATH: z.string().optional(),

    TTS_PROVIDER: z.enum(['elevenlabs', 'mock']).default('elevenlabs'),
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_VOICE_ID: z.string().default('EXAVITQu4vr4xnSDxMaL'),
    ELEVENLABS_MODEL_ID: z.string().default('eleven_multilingual_v2'),

    LIPSYNC_PROVIDER: z.enum(['fal', 'none', 'mock']).default('fal'),
    FAL_LIPSYNC_MODEL: z.string().default('veed/fabric-1.0'),

    MUSIC_PATH: z.string().optional(),
    MUSIC_VOLUME: z.coerce.number().min(0).max(1).default(0.12),
    FFMPEG_PATH: z.string().default('ffmpeg'),
    FFPROBE_PATH: z.string().default('ffprobe'),

    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  })
  .superRefine((env, ctx) => {
    if (env.DEMO_MODE) return;
    const need = (cond: boolean, key: string, why: string) => {
      if (cond) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when ${why}` });
    };
    need(!env.GEMINI_API_KEY, 'GEMINI_API_KEY', 'DEMO_MODE=false');
    need(env.VTON_PROVIDER === 'fal' && !env.FAL_KEY, 'FAL_KEY', 'VTON_PROVIDER=fal');
    need(env.VTON_PROVIDER === 'replicate' && !env.REPLICATE_API_TOKEN, 'REPLICATE_API_TOKEN', 'VTON_PROVIDER=replicate');
    need(env.VTON_PROVIDER !== 'mock' && !env.MODEL_AVATAR_PATH, 'MODEL_AVATAR_PATH', 'a real VTON provider is used');
    need(env.TTS_PROVIDER === 'elevenlabs' && !env.ELEVENLABS_API_KEY, 'ELEVENLABS_API_KEY', 'TTS_PROVIDER=elevenlabs');
    need(env.LIPSYNC_PROVIDER === 'fal' && !env.FAL_KEY, 'FAL_KEY', 'LIPSYNC_PROVIDER=fal');
  });

export type AppConfig = z.infer<typeof EnvSchema> & {
  inputDir: string;
  outputDir: string;
  dataDir: string;
  processedDir: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  // Treat empty strings from .env files as "unset".
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ''));
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${lines}\nSee .env.example (or set DEMO_MODE=true).`);
  }
  const c = parsed.data;
  const inputDir = path.resolve(c.INPUT_DIR);
  return {
    ...c,
    inputDir,
    outputDir: path.resolve(c.OUTPUT_DIR),
    dataDir: path.resolve(c.DATA_DIR),
    processedDir: path.join(inputDir, 'processed'),
  };
}

/** Public, secret-free view of the config for the UI. */
export function publicConfig(c: AppConfig) {
  return {
    demoMode: c.DEMO_MODE,
    language: c.REEL_LANGUAGE,
    reviewBeforeRender: c.REVIEW_BEFORE_RENDER,
    providers: {
      analysis: c.DEMO_MODE ? 'mock' : 'gemini',
      vton: c.DEMO_MODE ? 'mock' : c.VTON_PROVIDER,
      tts: c.DEMO_MODE ? 'mock' : c.TTS_PROVIDER,
      lipsync: c.DEMO_MODE ? 'mock' : c.LIPSYNC_PROVIDER,
    },
    inputDir: c.inputDir,
    outputDir: c.outputDir,
  };
}
