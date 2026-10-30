import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config';
import { publicConfig } from '../config';
import type { ReelPipeline } from '../services/pipeline';
import type { JsonStore } from '../services/store';
import { slugify } from '../services/folder';
import type { Item } from '../types';

const media = (c: AppConfig, p?: string) =>
  p && p.startsWith(c.outputDir + path.sep) ? `/media/${path.relative(c.outputDir, p).split(path.sep).join('/')}` : undefined;

export function itemView(c: AppConfig, item: Item) {
  return {
    ...item,
    photos: item.photos.map((p) => path.basename(p)),
    tryOnImageUrl: media(c, item.tryOnImagePath),
    reelUrl: item.reelPath ? `${media(c, item.reelPath)}?v=${encodeURIComponent(item.updatedAt)}` : undefined,
    tryOnImagePath: undefined,
    voicePath: undefined,
    talkingVideoPath: undefined,
    reelPath: undefined,
  };
}

const IdParam = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/) });
const ScriptBody = z.object({ scriptText: z.string().trim().min(10).max(2000) });
const StudioBody = z.object({
  garmentImageUrl: z.string().regex(/^data:image\/(png|jpe?g|webp|heic);base64,/, 'garmentImageUrl must be an image data URL'),
  title: z.string().trim().max(120).optional(),
  pricePln: z.coerce.number().nonnegative().max(1_000_000).optional(),
  description: z.string().max(2000).optional(),
});

export function reelsRouter(c: AppConfig, store: JsonStore, pipeline: ReelPipeline) {
  const r = Router();

  r.get('/config', (_req, res) => res.json(publicConfig(c)));

  r.get('/items', (_req, res) => res.json({ items: store.listItems().map((i) => itemView(c, i)) }));

  r.get('/items/:id', (req, res) => {
    const { id } = IdParam.parse(req.params);
    const item = store.getItem(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: itemView(c, item), jobs: store.listJobs().filter((j) => j.itemId === id) });
  });

  r.put('/items/:id/script', (req, res) => {
    const { id } = IdParam.parse(req.params);
    const { scriptText } = ScriptBody.parse(req.body);
    if (!store.getItem(id)) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: itemView(c, store.patchItem(id, { scriptText })) });
  });

  r.post('/items/:id/regenerate-script', (req, res) => {
    const { id } = IdParam.parse(req.params);
    if (!store.getItem(id)) return res.status(404).json({ error: 'Item not found' });
    res.status(202).json({ job: pipeline.enqueue(id, 'script') });
  });

  r.post('/items/:id/render', (req, res) => {
    const { id } = IdParam.parse(req.params);
    if (!store.getItem(id)) return res.status(404).json({ error: 'Item not found' });
    res.status(202).json({ job: pipeline.enqueue(id, 'render') });
  });

  r.post('/scan', async (_req, res) => res.json({ created: await pipeline.ingestFolder() }));

  r.get('/jobs', (_req, res) => res.json({ jobs: store.listJobs().slice(0, 200) }));

  r.get('/jobs/:id', (req, res) => {
    const { id } = IdParam.parse(req.params);
    const job = store.getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  });

  r.post('/jobs/:id/retry', (req, res) => {
    const { id } = IdParam.parse(req.params);
    if (!store.getJob(id)) return res.status(404).json({ error: 'Job not found' });
    res.status(202).json({ job: pipeline.retry(id) });
  });

  /** Studio upload: drop the photo into INPUT_DIR so it flows through the same pipeline. */
  r.post('/vton/generate', async (req, res) => {
    const body = StudioBody.parse(req.body);
    const m = body.garmentImageUrl.match(/^data:image\/([a-z]+);base64,(.*)$/s)!;
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const base = slugify(body.title || 'studio-item');
    let key = base;
    for (let n = 2; store.getItem(key); n++) key = `${base}-${n}`;
    const dir = path.join(c.inputDir, key);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `front.${ext}`), Buffer.from(m[2], 'base64'));
    await fs.writeFile(
      path.join(dir, 'info.json'),
      JSON.stringify({ name: body.title || undefined, price: body.pricePln, notes: body.description }, null, 2),
    );
    await pipeline.ingestItem(key, [`${key}/front.${ext}`]);
    const job = store.listJobs().find((j) => j.itemId === key);
    res.status(202).json({ itemId: key, jobId: job?.id });
  });

  return r;
}
