/**
 * `npm run reels` — process everything currently in INPUT_DIR once, without the UI, then exit.
 * Flags: --dry-run (list detected items only)
 */
import { bootstrap } from '../server/bootstrap';
import { groupFiles, listFilesRecursive } from '../server/services/folder';

async function main() {
  const { config, store, pipeline } = bootstrap();
  console.log(`[reels] input:  ${config.inputDir}\n[reels] output: ${config.outputDir}${config.DEMO_MODE ? '\n[reels] DEMO_MODE=true (mock providers)' : ''}`);

  if (process.argv.includes('--dry-run')) {
    for (const [key, files] of groupFiles(await listFilesRecursive(config.inputDir))) console.log(`  ${key}: ${files.join(', ')}`);
    return;
  }

  const created = await pipeline.ingestFolder();
  pipeline.start();
  await pipeline.whenIdle();

  const items = store.listItems().filter((i) => created.includes(i.id));
  if (!items.length) console.log('[reels] nothing new to process.');
  let failed = 0;
  for (const i of items) {
    if (i.status === 'failed') failed++;
    console.log(`  ${i.status === 'failed' ? '✗' : '✓'} ${i.id}: ${i.status}${i.reelPath ? ` → ${i.reelPath}` : ''}${i.error ? ` (${i.error})` : ''}`);
  }
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
