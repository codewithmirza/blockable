
import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { agentManager } from '~/lib/agents';

export async function action({ request, context }: ActionFunctionArgs) {
  const body = await request.json();
  const { action, data } = body;

  try {
    // Add RPC URL from environment if not provided
    if (!data.rpcUrl && context.cloudflare.env.RPC_URL) {
      data.rpcUrl = context.cloudflare.env.RPC_URL;
    }

    // Add private key from environment if not provided
    if (!data.privateKey && context.cloudflare.env.PRIVATE_KEY) {
      data.privateKey = context.cloudflare.env.PRIVATE_KEY;
    }

    // Use the blockchain agent to handle the request
    const result = await agentManager.executeTask('blockchain', {
      type: action,
      input: data
    });

    return json({ success: true, result });
  } catch (error) {
    console.error('Blockchain API error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
