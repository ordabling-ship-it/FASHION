import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { bootstrap } from '../src/server/bootstrap';
import { createApp } from '../src/server/app';
import { makeImage, tmpConfig } from './helpers';

describe('multi-photo upload + full pipeline extras', () => {
  it('accepts up to 5 photos as one item, converts HEIC, labels subtly, adds trends + TikTok note', async () => {
    const { config, root } = tmpConfig();
    const { pipeline, store, trends } = bootstrap({ config, log: () => {} });
    const app = createApp(config, store, pipeline, trends);
    const a = path.join(root, 'a.jpg');
    makeImage(a);
    const heic = path.join(__dirname, 'fixtures', 'sample.heic');

    const res = await request(app)
      .post('/api/uploads')
      .field('name', 'Zielony płaszcz')
      .field('price', '299')
      .attach('photos', a)
      .attach('photos', heic, { filename: 'IMG_0001.HEIC', contentType: 'application/octet-stream' })
      .expect(202);
    expect(res.body).toMatchObject({ itemId: 'zielony-plaszcz', photos: 2 });
    await pipeline.whenIdle();

    const item = store.getItem('zielony-plaszcz')!;
    expect(item.status).toBe('done');
    expect(item.workPhotos!.some((p) => p.endsWith('photo-2.jpg'))).toBe(true); // HEIC → JPEG
    expect(item.trends?.source).toBe('mock');
    expect(item.script!.hashtags.length).toBeGreaterThan(5);

    const out = path.join(config.outputDir, 'zielony-plaszcz');
    expect(fs.readdirSync(path.join(out, 'originals')).sort()).toEqual(['photo-1.jpg', 'photo-2.heic']);
    const meta = JSON.parse(fs.readFileSync(path.join(out, 'metadata.json'), 'utf8'));
    expect(meta.aiGenerated).toBe(true);
    expect(meta.tiktok.aiGeneratedContent).toBe(true);
    expect(meta.tiktok.disclosureNote).toMatch(/TikTok/);
    const caption = fs.readFileSync(path.join(out, 'caption.txt'), 'utf8');
    expect(caption).not.toMatch(/wygenerowan/i); // no big disclosure banner in the caption
    const ass = fs.readFileSync(path.join(out, 'captions.ass'), 'utf8');
    expect(ass).toMatch(/Style: AiLabel,Sans,24,&H8C/); // small, semi-transparent
    expect(ass).toMatch(/AiLabel,,0,0,0,,DEMO • Wygenerowano przez AI/); // DEMO only in demo mode
  });

  it('rejects more than 5 photos, non-images and empty uploads', async () => {
    const { config, root } = tmpConfig();
    const { pipeline, store } = bootstrap({ config, log: () => {} });
    const app = createApp(config, store, pipeline);
    const a = path.join(root, 'a.jpg');
    makeImage(a);
    let req = request(app).post('/api/uploads');
    for (let i = 0; i < 6; i++) req = req.attach('photos', a, `p${i}.jpg`);
    expect((await req.expect(400)).body.error).toMatch(/Max 5/);
    const txt = path.join(root, 'x.txt');
    fs.writeFileSync(txt, 'hi');
    await request(app).post('/api/uploads').attach('photos', txt).expect(400);
    await request(app).post('/api/uploads').field('name', 'x').expect(400);
    expect(store.listItems()).toHaveLength(0);
  });

  it('real-mode label has no DEMO prefix', async () => {
    const { buildAss } = await import('../src/server/services/render');
    const ass = buildAss({ cues: [], duration: 5, title: 'T', aiLabel: 'Wygenerowano przez AI' });
    expect(ass).not.toContain('DEMO');
  });
});
