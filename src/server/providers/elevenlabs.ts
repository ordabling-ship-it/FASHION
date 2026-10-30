import fs from 'fs/promises';
import path from 'path';
import type { TtsProvider } from './types';

export class ElevenLabsTtsProvider implements TtsProvider {
  readonly name = 'elevenlabs';
  constructor(private apiKey: string, private voiceId: string, private modelId: string) {}

  async synthesize({ text, language, outPath }: { text: string; language: 'pl' | 'en'; outPath: string }) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: this.modelId,
        language_code: language,
        voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
    const file = outPath.replace(/\.[a-z0-9]+$/i, '') + '.mp3';
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    return file;
  }
}
