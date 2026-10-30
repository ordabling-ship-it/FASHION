import path from 'path';
import express from 'express';
import { bootstrap } from './src/server/bootstrap';
import { createApp } from './src/server/app';
import { watchInputFolder } from './src/server/services/watcher';

async function main() {
  const { config, store, pipeline } = bootstrap();
  const app = createApp(config, store, pipeline);

  if (config.NODE_ENV !== 'production') {
    // Dev only: vite is a devDependency and is not needed in production.
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  pipeline.start();
  if (config.WATCH_INPUT) {
    watchInputFolder(config.inputDir, pipeline);
    console.log(`[reels] watching ${config.inputDir}`);
  }

  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(
      `[VTON Studio] http://localhost:${config.PORT} ${config.DEMO_MODE ? '(DEMO_MODE: mock providers, no real AI calls)' : ''}`,
    );
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
