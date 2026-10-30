import { describe, expect, it } from 'vitest';
import { loadConfig, publicConfig } from '../src/server/config';

describe('config', () => {
  it('defaults to demo mode and port 3000', () => {
    const c = loadConfig({} as NodeJS.ProcessEnv);
    expect(c.DEMO_MODE).toBe(true);
    expect(c.PORT).toBe(3000);
    expect(c.REEL_LANGUAGE).toBe('pl');
  });

  it('reads PORT and language from env', () => {
    const c = loadConfig({ PORT: '8080', REEL_LANGUAGE: 'en' } as NodeJS.ProcessEnv);
    expect(c.PORT).toBe(8080);
    expect(c.REEL_LANGUAGE).toBe('en');
  });

  it('requires API keys when DEMO_MODE=false', () => {
    expect(() => loadConfig({ DEMO_MODE: 'false' } as NodeJS.ProcessEnv)).toThrow(/GEMINI_API_KEY/);
  });

  it('never exposes secrets publicly', () => {
    const c = loadConfig({ GEMINI_API_KEY: 'secret-123', FAL_KEY: 'fal-xyz' } as NodeJS.ProcessEnv);
    expect(JSON.stringify(publicConfig(c))).not.toMatch(/secret-123|fal-xyz/);
  });
});
