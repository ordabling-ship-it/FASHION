import { loadConfig, type AppConfig } from './config';
import { createProviders } from './providers';
import type { Providers } from './providers';
import { ReelPipeline } from './services/pipeline';
import { JsonStore } from './services/store';

export function bootstrap(opts: { config?: AppConfig; providers?: Providers; log?: (m: string) => void } = {}) {
  const config = opts.config ?? loadConfig();
  const store = new JsonStore(config.dataDir);
  const providers = opts.providers ?? createProviders(config);
  const pipeline = new ReelPipeline(config, store, providers, opts.log);
  return { config, store, providers, pipeline };
}
