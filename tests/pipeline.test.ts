import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { bootstrap } from '../src/server/bootstrap';
import { createApp } from '../src/server/app';
import { createProviders } from '../src/server/providers';
import { makeImage, tmpConfig } from './helpers';

describe('pipeline orchestration (mock providers)', () => {
  it('turns a folder of photos into reels and moves processed photos', async () => {
    const { config } = tmpConfig();
    makeImage(path.join(config.inputDir, 'red-dress', 'front.jpg'));
    makeImage(path.join(config.inputDir, 'red-dress', 'back.jpg'));
    fs.writeFileSync(path.join(config.inputDir, 'red-dress', 'info.json'), JSON.stringify({ name: 'Red dress', price: 149 }));
    makeImage(path.join(config.inputDir, 'jeans_front.png'), 'blue');

    const { pipeline, store } = bootstrap({ config, log: () => {} });
    const created = await pipeline.ingestFolder();
    expect(created.sort()).toEqual(['jeans', 'red-dress']);
    await pipeline.whenIdle();

    for (const id of created) {
      const item = store.getItem(id)!;
      expect(item.status).toBe('done');
      const out = path.join(config.outputDir, id);
      for (const f of ['reel.mp4', 'script.txt', 'caption.txt', 'metadata.json']) expect(fs.existsSync(path.join(out, f))).toBe(true);
      const meta = JSON.parse(fs.readFileSync(path.join(out, 'metadata.json'), 'utf8'));
      expect(meta.aiGenerated).toBe(true);
      expect(meta.demoMode).toBe(true);
    }
    expect(fs.existsSync(path.join(config.inputDir, 'red-dress'))).toBe(false);
    expect(fs.readdirSync(path.join(config.processedDir, 'red-dress')).sort()).toEqual(['back.jpg', 'front.jpg', 'info.json']);
    expect(store.getItem('red-dress')!.info.currency).toBe('PLN');

    // Re-scanning does not duplicate work.
    expect(await pipeline.ingestFolder()).toEqual([]);
  });

  it('retries a failing step and then marks the job failed', async () => {
    const { config } = tmpConfig();
    makeImage(path.join(config.inputDir, 'top.jpg'));
    const providers = createProviders(config);
    let calls = 0;
    providers.tryOn = { name: 'flaky', tryOn: async () => { calls++; throw new Error('provider down'); } };
    const { pipeline, store } = bootstrap({ config, providers, log: () => {} });
    await pipeline.ingestFolder();
    await pipeline.whenIdle();
    const job = store.listJobs()[0];
    expect(calls).toBe(config.MAX_RETRIES + 1);
    expect(job.status).toBe('failed');
    expect(job.completedSteps).toEqual(['analyze']);
    expect(store.getItem('top')!.status).toBe('failed');
  });

  it('review mode stops before render; edited script is used for render', async () => {
    const { config } = tmpConfig({ REVIEW_BEFORE_RENDER: 'true' });
    makeImage(path.join(config.inputDir, 'coat.jpg'));
    const { pipeline, store } = bootstrap({ config, log: () => {} });
    const app = createApp(config, store, pipeline);
    await pipeline.ingestFolder();
    await pipeline.whenIdle();
    expect(store.getItem('coat')!.status).toBe('awaiting_review');

    const edited = 'Hej kochani! To jest mój edytowany tekst do rolki, kupujcie szybko!';
    await request(app).put('/api/items/coat/script').send({ scriptText: edited }).expect(200);
    const res = await request(app).post('/api/items/coat/render').expect(202);
    await pipeline.whenIdle();

    const job = (await request(app).get(`/api/jobs/${res.body.job.id}`).expect(200)).body.job;
    expect(job.status).toBe('completed');
    expect(job.progress).toBe(100);
    expect(fs.readFileSync(path.join(config.outputDir, 'coat', 'script.txt'), 'utf8').trim()).toBe(edited);

    const item = (await request(app).get('/api/items/coat').expect(200)).body.item;
    expect(item.status).toBe('done');
    expect(item.reelUrl).toMatch(/^\/media\/coat\/reel\.mp4/);
    expect(JSON.stringify(item)).not.toContain(config.outputDir); // no local paths leak
  });

  it('validates input', async () => {
    const { config } = tmpConfig();
    const { pipeline, store } = bootstrap({ config, log: () => {} });
    const app = createApp(config, store, pipeline);
    await request(app).put('/api/items/../etc/script').send({ scriptText: 'x' }).expect(404);
    await request(app).post('/api/vton/generate').send({ garmentImageUrl: 'http://evil' }).expect(400);
    await request(app).get('/api/jobs/nope').expect(404);
    const health = await request(app).get('/api/health').expect(200);
    expect(health.body.demoMode).toBe(true);
  });
});
