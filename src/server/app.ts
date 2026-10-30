import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import type { AppConfig } from './config';
import { publicConfig } from './config';
import type { ReelPipeline } from './services/pipeline';
import type { JsonStore } from './services/store';
import { reelsRouter } from './routes/reels';
import { legacyRouter } from './routes/legacy';
import type { TrendsService } from './services/trends';

export function createApp(config: AppConfig, store: JsonStore, pipeline: ReelPipeline, trends?: TrendsService) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '25mb' }));
  app.use(
    '/api',
    rateLimit({ windowMs: 60_000, limit: config.RATE_LIMIT_PER_MINUTE, standardHeaders: 'draft-7', legacyHeaders: false }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'VTON Studio Reels',
      timestamp: new Date().toISOString(),
      ...publicConfig(config),
      env: {
        hasGeminiKey: Boolean(config.GEMINI_API_KEY),
        hasFalKey: Boolean(config.FAL_KEY),
        hasReplicateToken: Boolean(config.REPLICATE_API_TOKEN),
        hasElevenLabsKey: Boolean(config.ELEVENLABS_API_KEY),
        hasStripeKey: Boolean(process.env.STRIPE_SECRET_KEY),
      },
    });
  });

  app.use('/api', reelsRouter(config, store, pipeline, trends));
  app.use('/api', legacyRouter());
  app.use('/media', express.static(config.outputDir, { index: false, dotfiles: 'ignore' }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: 'Invalid request', issues: err.issues });
    const status = typeof err?.status === 'number' ? err.status : 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
  });

  return app;
}
