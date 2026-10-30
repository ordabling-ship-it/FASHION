import path from 'path';
import chokidar from 'chokidar';
import type { ReelPipeline } from './pipeline';
import { itemKeyFor } from './folder';

/** Watch INPUT_DIR; debounce per item so all photos of one item are grouped before processing. */
export function watchInputFolder(inputDir: string, pipeline: ReelPipeline, debounceMs = 3000) {
  const pending = new Map<string, NodeJS.Timeout>();
  const watcher = chokidar.watch(inputDir, {
    ignoreInitial: false,
    ignored: (p: string) => {
      const rel = path.relative(inputDir, p);
      return rel === 'processed' || rel.startsWith('processed' + path.sep);
    },
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 200 },
  });
  watcher.on('add', (file) => {
    const key = itemKeyFor(path.relative(inputDir, file));
    if (!key) return;
    clearTimeout(pending.get(key));
    pending.set(
      key,
      setTimeout(() => {
        pending.delete(key);
        pipeline.ingestFolder().catch((e) => console.error('[watcher] ingest failed', e));
      }, debounceMs),
    );
  });
  return watcher;
}
