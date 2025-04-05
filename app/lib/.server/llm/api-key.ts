import { env } from 'node:process';

export function getApiKey(env: Env): string {
  const key = env.CLOUDFLARE_API_TOKEN;

  if (!key) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN - configure it in your environment variables');
  }

  return key;
}

export function getAIProvider(): 'cloudflare' {
  return 'cloudflare';
}