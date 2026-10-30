import { z } from 'zod';

export const GarmentAnalysisSchema = z.object({
  productName: z.string().min(1),
  category: z.string().min(1),
  colors: z.array(z.string()).min(1),
  material: z.string().min(1),
  style: z.string().min(1),
  fit: z.string().min(1),
  occasions: z.array(z.string()).min(1),
  sellingPoints: z.array(z.string()).min(3).max(5),
});
export type GarmentAnalysis = z.infer<typeof GarmentAnalysisSchema>;

export const ReelScriptSchema = z.object({
  hook: z.string().min(1),
  compliments: z.array(z.string()).min(2).max(3),
  stylingTip: z.string().min(1),
  callToAction: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(3).max(15),
});
export type ReelScript = z.infer<typeof ReelScriptSchema>;

export function scriptToText(s: Pick<ReelScript, 'hook' | 'compliments' | 'stylingTip' | 'callToAction'>) {
  return [s.hook, ...s.compliments, s.stylingTip, s.callToAction].join(' ');
}

export const ItemInfoSchema = z.object({
  name: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().optional(),
  language: z.enum(['pl', 'en']).optional(),
  notes: z.string().optional(),
});
export type ItemInfo = z.infer<typeof ItemInfoSchema>;

export type StepName = 'analyze' | 'tryon' | 'script' | 'tts' | 'lipsync' | 'render' | 'output';
export const ALL_STEPS: StepName[] = ['analyze', 'tryon', 'script', 'tts', 'lipsync', 'render', 'output'];
export type JobKind = 'full' | 'script' | 'render';

export const STEPS_BY_KIND: Record<JobKind, StepName[]> = {
  full: ALL_STEPS,
  script: ['script'],
  render: ['tts', 'lipsync', 'render', 'output'],
};

export type ItemStatus = 'new' | 'processing' | 'awaiting_review' | 'done' | 'failed';

export interface Item {
  id: string; // slug, also output folder name
  name: string;
  photos: string[]; // absolute paths (moved to processed/ after output)
  info: ItemInfo;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  analysis?: GarmentAnalysis;
  tryOnImagePath?: string;
  script?: ReelScript;
  scriptText?: string; // editable spoken text actually used for TTS
  voicePath?: string;
  talkingVideoPath?: string;
  reelPath?: string;
  error?: string;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'paused';

export interface Job {
  id: string;
  itemId: string;
  kind: JobKind;
  status: JobStatus;
  steps: StepName[];
  currentStep?: StepName;
  completedSteps: StepName[];
  progress: number; // 0..100
  attempts: number;
  maxRetries: number;
  logs: { at: string; level: 'info' | 'warn' | 'error'; msg: string }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}
