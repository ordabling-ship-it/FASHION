import type { GarmentAnalysis } from '../types';
import type { ImageInput, TryOnProvider } from './types';
import { downloadTo, sleep, toDataUri } from './util';

/** Replicate predictions API. model = "owner/name:version" or "owner/name" (official models). */
export class ReplicateTryOnProvider implements TryOnProvider {
  readonly name = 'replicate';
  constructor(private token: string, private model: string, private avatarPath: string) {}

  async tryOn({ garment, analysis, outPath }: { garment: ImageInput; analysis?: GarmentAnalysis; outPath: string }) {
    const headers = { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', Prefer: 'wait' };
    const [ref, version] = this.model.split(':');
    const input = {
      human_img: await toDataUri(this.avatarPath),
      garm_img: await toDataUri(garment.path, garment.mimeType),
      garment_des: analysis?.productName ?? 'garment',
    };
    const url = version ? 'https://api.replicate.com/v1/predictions' : `https://api.replicate.com/v1/models/${ref}/predictions`;
    const body = version ? { version, input } : { input };
    let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`replicate submit failed: ${res.status} ${await res.text()}`);
    let pred = (await res.json()) as any;
    const deadline = Date.now() + 10 * 60_000;
    while (!['succeeded', 'failed', 'canceled'].includes(pred.status) && Date.now() < deadline) {
      await sleep(3000);
      res = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${this.token}` } });
      pred = await res.json();
    }
    if (pred.status !== 'succeeded') throw new Error(`replicate prediction ${pred.status}: ${pred.error ?? ''}`);
    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (typeof out !== 'string') throw new Error('replicate: unexpected output');
    return downloadTo(out, outPath);
  }
}
