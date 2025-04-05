import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { mcpAgent } from '~/lib/agents/mcp';
import { createCloudflareAgent } from '~/lib/agents/mcp-cloudflare';
import { createMCPAgent, createCloudflareMCPAgent } from '~/lib/agents/agent-exports';

// Helper function to get chain RPC URL
function getChainRpcUrl(chain: string, context: any): string {
  switch (chain.toLowerCase()) {
    case 'polygon':
    case 'mumbai':
      return 'https://polygon-mumbai.infura.io/v3/';
    case 'ethereum':
    case 'goerli':
      return 'https://eth-goerli.public.blastapi.io';
    case 'hashkey':
    case 'hashkeytest':
      return context.cloudflare.env.HASHKEY_RPC_URL || 'https://testnet-rpc.hashkey.io';
    case 'hyperlane':
      return context.cloudflare.env.HYPERLANE_RPC_URL || 'https://sepolia.hyperlane.xyz';
    default:
      return 'https://polygon-mumbai.infura.io/v3/';
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const body = await request.json() as { chain: string; intent: string; contextSources?: string[] };
  const { chain, intent, contextSources = [] } = body;

  try {
    // Determine whether to use Cloudflare Agents or fallback to regular agent
    const useCloudflareAgent = context.cloudflare.env.USE_CLOUDFLARE_AGENTS === 'true' && 
                              context.cloudflare.env.CLOUDFLARE_API_TOKEN &&
                              context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID;
    
    let result;
    
    if (useCloudflareAgent) {
      // Use Cloudflare Agents and Workflows for processing
      if (context.cloudflare.env.AGENT_STATE) {
        // Create agent instance using the new factory function
        const agent = createCloudflareMCPAgent();
        
        // Process intent using the agent
        result = await agent.processIntent(intent, chain, contextSources);
      } else {
        // Fallback to direct API calls if Durable Objects aren't available
        const cloudflareAgent = await createCloudflareAgent(
          context.cloudflare.env.CLOUDFLARE_API_TOKEN,
          context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID
        );
        
        // Process the intent with Cloudflare Workflows
        result = await cloudflareAgent.processIntent(intent, chain, contextSources);
      }
    } else {
      // Fallback to the regular MCP agent
      if (!mcpAgent) {
        throw new Error('MCP agent not initialized');
      }
      
      // Initialize the agent with chain-specific configuration
      await mcpAgent.initialize({
        rpcUrl: getChainRpcUrl(chain, context),
        privateKey: context.cloudflare.env.PRIVATE_KEY || '',
        polygonscanApiKey: context.cloudflare.env.POLYGONSCAN_API_KEY || '',
      });
      
      // Process the intent with regular agent
      result = await mcpAgent.processIntent(intent, chain, contextSources);
    }

    // Return the processed intent
    return json({ success: true, result });
  } catch (error: any) {
    console.error('MCP API error:', error);
    return json(
      { success: false, error: error.message || 'An error occurred processing the intent' },
      { status: 500 }
    );
  }
}