import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import type { AppConfig } from '../config';
import type { Providers } from '../providers';
import { toImageInput } from '../providers/util';
import {
  ItemInfoSchema,
  STEPS_BY_KIND,
  scriptToText,
  type Item,
  type Job,
  type JobKind,
  type StepName,
} from '../types';
import { groupFiles, listFilesRecursive, readItemInfoRaw } from './folder';
import { renderReel } from './render';
import type { JsonStore } from './store';

const AI_LABEL = { pl: 'Treść wygenerowana przez AI', en: 'AI-generated content' } as const;

export class ReelPipeline extends EventEmitter {
  private running = false;
  private queue: string[] = [];
  private idleWaiters: (() => void)[] = [];

  constructor(
    private config: AppConfig,
    private store: JsonStore,
    private providers: Providers,
    private log: (msg: string) => void = (m) => console.log(m),
  ) {
    super();
    // Resume jobs interrupted by a restart.
    for (const job of store.listJobs().reverse()) {
      if (job.status === 'running' || job.status === 'queued') {
        job.status = 'queued';
        store.upsertJob(job);
        this.queue.push(job.id);
      }
    }
  }

  // ---------- ingestion ----------

  /** Scan INPUT_DIR and create (and enqueue) items that don't exist yet. Returns new item ids. */
  async ingestFolder(): Promise<string[]> {
    await fs.mkdir(this.config.inputDir, { recursive: true });
    const files = await listFilesRecursive(this.config.inputDir);
    const created: string[] = [];
    for (const [key, rels] of groupFiles(files)) {
      const id = await this.ingestItem(key, rels);
      if (id) created.push(id);
    }
    return created;
  }

  async ingestItem(key: string, rels: string[]): Promise<string | null> {
    const photos = rels.map((r) => path.join(this.config.inputDir, r));
    const existing = this.store.getItem(key);
    if (existing) {
      // New photos for an item that is not yet finished: just add them.
      if (existing.status !== 'done') {
        const merged = Array.from(new Set([...existing.photos, ...photos]));
        if (merged.length !== existing.photos.length) this.store.patchItem(key, { photos: merged });
      }
      return null;
    }
    const info = ItemInfoSchema.parse(await readItemInfoRaw(this.config.inputDir, key, rels));
    if (info.price !== undefined && !info.currency) info.currency = this.config.DEFAULT_CURRENCY;
    const now = new Date().toISOString();
    this.store.upsertItem({
      id: key,
      name: info.name ?? key.replace(/-/g, ' '),
      photos,
      info,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    });
    this.enqueue(key, 'full');
    this.log(`[reels] new item "${key}" (${photos.length} photo(s))`);
    return key;
  }

  // ---------- queue ----------

  enqueue(itemId: string, kind: JobKind): Job {
    if (!this.store.getItem(itemId)) throw new Error(`Unknown item ${itemId}`);
    const steps = kind === 'full' && this.config.REVIEW_BEFORE_RENDER ? STEPS_BY_KIND.full.slice(0, 3) : STEPS_BY_KIND[kind];
    const now = new Date().toISOString();
    const job: Job = {
      id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      itemId,
      kind,
      status: 'queued',
      steps,
      completedSteps: [],
      progress: 0,
      attempts: 0,
      maxRetries: this.config.MAX_RETRIES,
      logs: [{ at: now, level: 'info', msg: `queued (${kind}: ${steps.join(' → ')})` }],
      createdAt: now,
      updatedAt: now,
    };
    this.store.upsertJob(job);
    this.store.patchItem(itemId, { status: 'processing', error: undefined });
    this.queue.push(job.id);
    this.kick();
    return job;
  }

  retry(jobId: string): Job {
    const job = this.store.getJob(jobId);
    if (!job) throw new Error(`Unknown job ${jobId}`);
    if (job.status !== 'failed') throw new Error('Only failed jobs can be retried');
    job.status = 'queued';
    job.error = undefined;
    job.attempts = 0;
    this.addLog(job, 'info', 'manual retry');
    this.store.patchItem(job.itemId, { status: 'processing', error: undefined });
    this.queue.push(job.id);
    this.kick();
    return job;
  }

  /** Resolves once the queue is empty (used by the CLI and tests). */
  whenIdle(): Promise<void> {
    if (!this.running && this.queue.length === 0) return Promise.resolve();
    return new Promise((r) => this.idleWaiters.push(r));
  }

  start() {
    this.kick();
  }

  private kick() {
    if (this.running) return;
    this.running = true;
    void this.loop();
  }

  private async loop() {
    try {
      while (this.queue.length) {
        const id = this.queue.shift()!;
        const job = this.store.getJob(id);
        if (job && job.status === 'queued') await this.runJob(job);
      }
    } finally {
      this.running = false;
      const w = this.idleWaiters.splice(0);
      w.forEach((fn) => fn());
    }
  }

  private addLog(job: Job, level: 'info' | 'warn' | 'error', msg: string) {
    job.logs.push({ at: new Date().toISOString(), level, msg });
    if (job.logs.length > 200) job.logs.splice(0, job.logs.length - 200);
    this.store.upsertJob(job);
    this.emit('job', job);
    this.log(`[reels] ${job.itemId} ${level}: ${msg}`);
  }

  private async runJob(job: Job) {
    job.status = 'running';
    this.store.upsertJob(job);
    for (const step of job.steps) {
      if (job.completedSteps.includes(step)) continue;
      job.currentStep = step;
      let ok = false;
      for (let attempt = 0; attempt <= job.maxRetries && !ok; attempt++) {
        job.attempts = attempt + 1;
        this.addLog(job, 'info', `step ${step} (attempt ${attempt + 1}/${job.maxRetries + 1})`);
        try {
          await this.runStep(step, job.itemId);
          ok = true;
        } catch (err: any) {
          this.addLog(job, 'warn', `step ${step} failed: ${err?.message ?? err}`);
          if (attempt < job.maxRetries) await new Promise((r) => setTimeout(r, Math.min(30_000, 1000 * 2 ** attempt)));
          else job.error = String(err?.message ?? err);
        }
      }
      if (!ok) {
        job.status = 'failed';
        this.addLog(job, 'error', `job failed at step ${step}`);
        this.store.patchItem(job.itemId, { status: 'failed', error: job.error });
        return;
      }
      job.completedSteps.push(step);
      job.progress = Math.round((job.completedSteps.length / job.steps.length) * 100);
      this.store.upsertJob(job);
      this.emit('job', job);
    }
    job.status = 'completed';
    job.currentStep = undefined;
    job.progress = 100;
    this.addLog(job, 'info', 'completed');
    const item = this.store.getItem(job.itemId)!;
    this.store.patchItem(job.itemId, { status: item.reelPath && job.steps.includes('output') ? 'done' : 'awaiting_review' });
  }

  // ---------- steps ----------

  private itemDir(id: string) {
    return path.join(this.config.outputDir, id);
  }
  private lang(item: Item) {
    return item.info.language ?? this.config.REEL_LANGUAGE;
  }

  async runStep(step: StepName, itemId: string) {
    const item = this.store.getItem(itemId);
    if (!item) throw new Error(`Unknown item ${itemId}`);
    const work = path.join(this.itemDir(itemId), 'work');
    await fs.mkdir(work, { recursive: true });
    const p = this.providers;

    switch (step) {
      case 'analyze': {
        if (!item.photos.length) throw new Error('Item has no photos');
        const analysis = await p.analysis.analyzeGarment(item.photos.map(toImageInput), item.info);
        this.store.patchItem(itemId, { analysis, name: item.info.name ?? analysis.productName });
        break;
      }
      case 'tryon': {
        const tryOnImagePath = await p.tryOn.tryOn({
          garment: toImageInput(item.photos[0]),
          analysis: item.analysis,
          outPath: path.join(work, 'tryon.png'),
        });
        this.store.patchItem(itemId, { tryOnImagePath });
        break;
      }
      case 'script': {
        if (!item.analysis) throw new Error('Missing analysis');
        const script = await p.script.writeScript({ analysis: item.analysis, info: item.info, language: this.lang(item) });
        this.store.patchItem(itemId, { script, scriptText: scriptToText(script) });
        break;
      }
      case 'tts': {
        const text = item.scriptText ?? (item.script ? scriptToText(item.script) : undefined);
        if (!text) throw new Error('Missing script');
        const voicePath = await p.tts.synthesize({ text, language: this.lang(item), outPath: path.join(work, 'voice.mp3') });
        this.store.patchItem(itemId, { voicePath, talkingVideoPath: undefined });
        break;
      }
      case 'lipsync': {
        if (!item.tryOnImagePath || !item.voicePath) throw new Error('Missing try-on image or voiceover');
        const talkingVideoPath = await p.lipSync.animate({
          imagePath: item.tryOnImagePath,
          audioPath: item.voicePath,
          outPath: path.join(work, 'talking.mp4'),
        });
        this.store.patchItem(itemId, { talkingVideoPath: talkingVideoPath ?? undefined });
        break;
      }
      case 'render': {
        const visual = item.talkingVideoPath ?? item.tryOnImagePath;
        if (!visual || !item.voicePath) throw new Error('Missing visual or voiceover');
        const lang = this.lang(item);
        const currency = item.info.currency ?? this.config.DEFAULT_CURRENCY;
        const out = await renderReel({
          ffmpeg: this.config.FFMPEG_PATH,
          ffprobe: this.config.FFPROBE_PATH,
          visualPath: visual,
          visualIsVideo: Boolean(item.talkingVideoPath),
          audioPath: item.voicePath,
          musicPath: this.config.MUSIC_PATH,
          musicVolume: this.config.MUSIC_VOLUME,
          scriptText: item.scriptText ?? '',
          title: item.name,
          priceLabel: item.info.price !== undefined ? `${item.info.price} ${currency}` : undefined,
          aiLabel: (this.config.DEMO_MODE ? 'DEMO • ' : '') + AI_LABEL[lang],
          outPath: path.join(this.itemDir(itemId), 'reel.mp4'),
        });
        this.store.patchItem(itemId, { reelPath: out.path });
        break;
      }
      case 'output': {
        await this.writeOutputs(item);
        break;
      }
    }
  }

  private async writeOutputs(item: Item) {
    const dir = this.itemDir(item.id);
    const lang = this.lang(item);
    await fs.writeFile(path.join(dir, 'script.txt'), (item.scriptText ?? '') + '\n');
    const caption = item.script
      ? `${item.script.caption}\n\n${item.script.hashtags.join(' ')} #AIgenerated\n\n${AI_LABEL[lang]}.`
      : '';
    await fs.writeFile(path.join(dir, 'caption.txt'), caption + '\n');

    // Keep the originals next to the reel, then move the sources out of the watched folder.
    const originalsDir = path.join(dir, 'originals');
    await fs.mkdir(originalsDir, { recursive: true });
    const processedDir = path.join(this.config.processedDir, item.id);
    await fs.mkdir(processedDir, { recursive: true });
    const moved: string[] = [];
    for (const photo of item.photos) {
      try {
        await fs.copyFile(photo, path.join(originalsDir, path.basename(photo)));
        if (!photo.startsWith(this.config.processedDir + path.sep)) {
          const dest = path.join(processedDir, path.basename(photo));
          await fs.rename(photo, dest);
          moved.push(dest);
        } else moved.push(photo);
      } catch (err: any) {
        if (err?.code !== 'ENOENT') throw err;
      }
    }

    // Tidy up subfolder items: move info.json too and remove the now-empty folder.
    const srcDirs = new Set(item.photos.map((ph) => path.dirname(ph)).filter((d) => d !== this.config.inputDir && !d.startsWith(this.config.processedDir)));
    for (const d of srcDirs) {
      await fs.rename(path.join(d, 'info.json'), path.join(processedDir, 'info.json')).catch(() => undefined);
      await fs.rmdir(d).catch(() => undefined);
    }

    const metadata = {
      id: item.id,
      name: item.name,
      info: item.info,
      language: lang,
      analysis: item.analysis,
      script: item.script,
      spokenText: item.scriptText,
      files: { reel: 'reel.mp4', script: 'script.txt', caption: 'caption.txt', originals: 'originals/' },
      providers: {
        analysis: this.providers.analysis.name,
        script: this.providers.script.name,
        tryOn: this.providers.tryOn.name,
        tts: this.providers.tts.name,
        lipSync: this.providers.lipSync.name,
      },
      demoMode: this.config.DEMO_MODE,
      aiGenerated: true,
      aiDisclosure: 'This video, the virtual model, her voice and the script were generated with AI (EU AI Act Art. 50).',
      generatedAt: new Date().toISOString(),
    };
    await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    this.store.patchItem(item.id, { photos: moved.length ? moved : item.photos });
  }
}
