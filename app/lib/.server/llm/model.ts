import { Ai } from '@cloudflare/ai';
import { createSwitchableStream } from './switchable-stream';
import { streamText } from './stream-text';

export async function streamLLMResponse(input: string) {
  const ai = new Ai({
    binding: env.AI
  });

  const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: input }],
    stream: true
  });

  return createSwitchableStream(streamText(response));
}

import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}