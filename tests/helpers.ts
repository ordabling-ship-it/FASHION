import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { loadConfig } from '../src/server/config';

export function tmpConfig(extra: Record<string, string> = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reels-'));
  const config = loadConfig({
    DEMO_MODE: 'true',
    INPUT_DIR: path.join(root, 'input'),
    OUTPUT_DIR: path.join(root, 'output'),
    DATA_DIR: path.join(root, 'data'),
    MAX_RETRIES: '1',
    ...extra,
  } as NodeJS.ProcessEnv);
  fs.mkdirSync(config.inputDir, { recursive: true });
  return { root, config };
}

export function makeImage(file: string, color = 'red') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=400x500`, '-frames:v', '1', file]);
}
