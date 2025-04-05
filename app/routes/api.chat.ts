import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>();

  const stream = new SwitchableStream();

  try {
    // Process through the Cloudflare AI API
    try {
      const { createCloudflareAgent } = await import('~/lib/agents/mcp-cloudflare');
      const cloudflareAgent = await createCloudflareAgent(
        context.cloudflare.env.CLOUDFLARE_API_TOKEN,
        context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID
      );
      
      // Process the chat with Cloudflare AI
      const aiResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.cloudflare.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });
      
      // Handle streaming response from Cloudflare AI
      if (aiResponse.body) {
        return new Response(aiResponse.body, {
          status: 200,
          headers: {
            contentType: 'text/plain; charset=utf-8',
          },
        });
      }
      
      throw new Error("No response body from Cloudflare AI");
    } catch (error) {
      console.error("Error using Cloudflare AI:", error);
      throw error;
    }

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
