import type { GarmentAnalysis } from '../types';
import type { ImageInput, LipSyncProvider, TryOnProvider } from './types';
import { downloadTo, sleep, toDataUri } from './util';

/** Minimal client for the fal.ai queue REST API (https://docs.fal.ai/model-endpoints/queue). */
export async function falRun(key: string, model: string, input: Record<string, unknown>, timeoutMs = 10 * 60_000) {
  const headers = { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
  const submit = await fetch(`https://queue.fal.run/${model}`, { method: 'POST', headers, body: JSON.stringify(input) });
  if (!submit.ok) throw new Error(`fal submit ${model} failed: ${submit.status} ${await submit.text()}`);
  const { status_url, response_url } = (await submit.json()) as { status_url: string; response_url: string };
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(3000);
    const st = await fetch(status_url, { headers });
    const body = (await st.json()) as { status: string };
    if (body.status === 'COMPLETED') break;
    if (!['IN_QUEUE', 'IN_PROGRESS'].includes(body.status)) throw new Error(`fal ${model} status ${body.status}`);
  }
  const out = await fetch(response_url, { headers });
  if (!out.ok) throw new Error(`fal result ${model} failed: ${out.status} ${await out.text()}`);
  return (await out.json()) as any;
}

export class FalTryOnProvider implements TryOnProvider {
  readonly name = 'fal';
  constructor(private key: string, private model: string, private avatarPath: string) {}

  async tryOn({ garment, analysis, outPath }: { garment: ImageInput; analysis?: GarmentAnalysis; outPath: string }) {
    const human = await toDataUri(this.avatarPath);
    const garm = await toDataUri(garment.path, garment.mimeType);
    const input: Record<string, unknown> = this.model.includes('idm-vton')
      ? { human_image_url: human, garment_image_url: garm, description: analysis?.productName ?? 'garment' }
      : { human_image_url: human, garment_image_url: garm, cloth_type: clothType(analysis?.category) };
    const res = await falRun(this.key, this.model, input);
    const url: string | undefined = res?.image?.url ?? res?.images?.[0]?.url;
    if (!url) throw new Error(`fal ${this.model}: no image in response`);
    return downloadTo(url, outPath);
  }
}

export function clothType(category?: string): 'upper' | 'lower' | 'overall' {
  const c = (category ?? '').toLowerCase();
  if (/(dress|sukien|jumpsuit|kombinez|overall|coat|płaszcz)/.test(c)) return 'overall';
  if (/(pants|trousers|spodn|skirt|spódnic|jeans|shorts|szort)/.test(c)) return 'lower';
  return 'upper';
}

export class FalLipSyncProvider implements LipSyncProvider {
  readonly name = 'fal';
  constructor(private key: string, private model: string) {}

  async animate({ imagePath, audioPath, outPath }: { imagePath: string; audioPath: string; outPath: string }) {
    const res = await falRun(this.key, this.model, {
      image_url: await toDataUri(imagePath),
      audio_url: await toDataUri(audioPath),
      resolution: '720p',
    });
    const url: string | undefined = res?.video?.url;
    if (!url) throw new Error(`fal ${this.model}: no video in response`);
    return downloadTo(url, outPath);
  }
}
