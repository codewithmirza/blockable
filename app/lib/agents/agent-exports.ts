import { Agent } from 'agents';
import type { AgentNamespace } from 'agents';
import { MCPAgent } from './mcp';
import { CloudflareMCPAgent } from './mcp-cloudflare';

// Export the agent classes for use with Durable Objects
export { MCPAgent, CloudflareMCPAgent };

// Setup for Durable Objects
export const DurableObjectAgent = Agent;

// Create agent instances
export const createMCPAgent = () => new MCPAgent();
export const createCloudflareMCPAgent = (apiToken?: string, accountId?: string) => 
  new CloudflareMCPAgent(apiToken || '', accountId || '');