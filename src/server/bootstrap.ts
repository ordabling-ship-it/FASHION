import { loadConfig, type AppConfig } from './config';
import { createProviders } from './providers';
import type { Providers } from './providers';
import { ReelPipeline } from './services/pipeline';
import { JsonStore } from './services/store';
import { TrendsService } from './services/trends';

export function bootstrap(opts: { config?: AppConfig; providers?: Providers; log?: (m: string) => void } = {}) {
  const config = opts.config ?? loadConfig();
  const store = new JsonStore(config.dataDir);
  const providers = opts.providers ?? createProviders(config);
  const trends = new TrendsService(config.dataDir, providers.trends, config.TRENDS_TTL_HOURS * 3_600_000);
  const pipeline = new ReelPipeline(config, store, providers, opts.log, trends);
  return { config, store, providers, pipeline, trends };
}
