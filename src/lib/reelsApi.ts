export type StepName = 'prepare' | 'analyze' | 'tryon' | 'script' | 'tts' | 'lipsync' | 'render' | 'output';

export const STEP_LABELS: Record<StepName, { pl: string; detail: string }> = {
  prepare: { pl: 'Przygotowanie zdjęć', detail: 'Obrót, zmniejszenie i konwersja (HEIC/duże pliki → JPEG).' },
  analyze: { pl: 'Analiza ubrania (Gemini)', detail: 'Kategoria, kolor, materiał, krój, okazje i atuty.' },
  tryon: { pl: 'Wirtualna przymiarka (VTON)', detail: 'Ubranie na modelce AI (Fal.ai / Replicate).' },
  script: { pl: 'Scenariusz influencerki', detail: 'Hook, komplementy, porada stylizacyjna i CTA.' },
  tts: { pl: 'Głos lektorki (TTS)', detail: 'Energiczny voiceover (ElevenLabs).' },
  lipsync: { pl: 'Mówiące wideo (lip-sync)', detail: 'Modelka mówi do obserwujących.' },
  render: { pl: 'Montaż rolki 9:16', detail: 'Napisy, muzyka, nazwa i cena, eksport 1080x1920.' },
  output: { pl: 'Zapis plików', detail: 'reel.mp4, script.txt, caption, metadata.json.' },
};

export interface JobDto {
  id: string;
  itemId: string;
  kind: 'full' | 'script' | 'render';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  steps: StepName[];
  currentStep?: StepName;
  completedSteps: StepName[];
  progress: number;
  attempts: number;
  maxRetries: number;
  logs: { at: string; level: string; msg: string }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDto {
  id: string;
  name: string;
  photos: string[];
  info: { name?: string; price?: number; currency?: string; language?: 'pl' | 'en'; notes?: string };
  status: 'new' | 'processing' | 'awaiting_review' | 'done' | 'failed';
  analysis?: Record<string, unknown> & { productName: string; category: string; sellingPoints: string[] };
  script?: { hook: string; compliments: string[]; stylingTip: string; callToAction: string; caption: string; hashtags: string[] };
  scriptText?: string;
  trends?: { source: string; region: string; fetchedAt: string; hookStyles: string[]; hashtags: string[] };
  tryOnImageUrl?: string;
  reelUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicConfigDto {
  demoMode: boolean;
  language: 'pl' | 'en';
  reviewBeforeRender: boolean;
  providers: Record<string, string>;
  inputDir: string;
  outputDir: string;
  trends: string;
  trendsRegion: string;
  uploadMaxFiles: number;
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const reelsApi = {
  config: () => fetch('/api/config').then((r) => json<PublicConfigDto>(r)),
  items: () => fetch('/api/items').then((r) => json<{ items: ItemDto[] }>(r)),
  item: (id: string) => fetch(`/api/items/${id}`).then((r) => json<{ item: ItemDto; jobs: JobDto[] }>(r)),
  job: (id: string) => fetch(`/api/jobs/${id}`).then((r) => json<{ job: JobDto }>(r)),
  jobs: () => fetch('/api/jobs').then((r) => json<{ jobs: JobDto[] }>(r)),
  scan: () => fetch('/api/scan', { method: 'POST' }).then((r) => json<{ created: string[] }>(r)),
  saveScript: (id: string, scriptText: string) =>
    fetch(`/api/items/${id}/script`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptText }),
    }).then((r) => json<{ item: ItemDto }>(r)),
  regenerateScript: (id: string) => fetch(`/api/items/${id}/regenerate-script`, { method: 'POST' }).then((r) => json<{ job: JobDto }>(r)),
  render: (id: string) => fetch(`/api/items/${id}/render`, { method: 'POST' }).then((r) => json<{ job: JobDto }>(r)),
  upload: (files: File[], fields: { name?: string; price?: string; language?: string; notes?: string }) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));
    Object.entries(fields).forEach(([k, v]) => v && fd.append(k, v));
    return fetch('/api/uploads', { method: 'POST', body: fd }).then((r) => json<{ itemId: string; jobId: string; photos: number }>(r));
  },
  retry: (jobId: string) => fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' }).then((r) => json<{ job: JobDto }>(r)),
};
