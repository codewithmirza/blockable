import type { MCPContext, MCPDataSource, MCPMessage, MCPSubscription } from './mcp';
import { Agent } from 'agents';

// Define environment and state types
interface CloudflareMCPAgentEnv {
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

interface CloudflareMCPAgentState {
  accountId: string;
  configuredAt: number;
  workflowIds: Record<string, string>;
  dataSources: Record<string, MCPDataSource>;
}

export class CloudflareMCPAgent extends Agent<CloudflareMCPAgentEnv, CloudflareMCPAgentState> {
  private apiToken: string;
  private accountId: string;
  private workflowIds: Map<string, string> = new Map();
  private dataSources: Map<string, MCPDataSource> = new Map();

  constructor(apiToken: string, accountId: string, ctx: any = {}, env: CloudflareMCPAgentEnv = {}) {
    super(ctx, env);
    this.apiToken = apiToken;
    this.accountId = accountId;
  }

  async initialize(): Promise<this> {
    try {
      // Register workflows for different functions
      await this.setupWorkflows();
      
      // Register default data sources
      this.registerDataSource({
        id: 'polygon-onchain',
        type: 'onchain',
        config: {
          rpcUrl: 'https://rpc.ankr.com/polygon_mumbai',
          chainId: 80001
        },
        lastUpdated: Date.now()
      });
      
      // Store important authentication information in Agent's state
      await this.setState({
        accountId: this.accountId,
        configuredAt: Date.now(),
        workflowIds: Object.fromEntries(this.workflowIds),
        dataSources: Object.fromEntries(this.dataSources)
      });
      
      return this;
    } catch (error) {
      console.error("Failed to initialize Cloudflare MCP Agent:", error);
      throw error;
    }
  }
  
  private async setupWorkflows(): Promise<void> {
    const workflowDefinitions = [
      {
        name: 'process-intent',
        description: 'Process user intent and convert to blockchain actions',
        steps: [
          {
            name: 'parse-intent',
            action: 'parse_intent',
            input: {
              intent: '{{ $.intent }}',
              context: '{{ $.context }}'
            }
          },
          {
            name: 'validate-action',
            action: 'validate_action',
            input: {
              action: '{{ $.parse-intent.action }}',
              params: '{{ $.parse-intent.params }}',
              chain: '{{ $.chain }}'
            }
          },
          {
            name: 'format-response',
            action: 'format_response',
            input: {
              action: '{{ $.validate-action.action }}',
              params: '{{ $.validate-action.params }}',
              is_valid: '{{ $.validate-action.is_valid }}',
              validation_message: '{{ $.validate-action.message }}'
            }
          }
        ]
      },
      {
        name: 'cross-chain-messaging',
        description: 'Send messages between different blockchain networks',
        steps: [
          {
            name: 'prepare-message',
            action: 'prepare_message',
            input: {
              message: '{{ $.message }}',
              source: '{{ $.source }}',
              destination: '{{ $.destination }}'
            }
          },
          {
            name: 'sign-message',
            action: 'sign_message',
            input: {
              message: '{{ $.prepare-message.formatted_message }}',
              private_key: '{{ $.private_key }}'
            }
          },
          {
            name: 'send-message',
            action: 'send_message',
            input: {
              signed_message: '{{ $.sign-message.signed_message }}',
              destination: '{{ $.destination }}'
            }
          }
        ]
      },
      {
        name: 'data-fetching',
        description: 'Fetch data from various on-chain and off-chain sources',
        steps: [
          {
            name: 'identify-source',
            action: 'identify_data_source',
            input: {
              query: '{{ $.query }}',
              source_name: '{{ $.source_name }}'
            }
          },
          {
            name: 'fetch-data',
            action: 'fetch_data',
            input: {
              source: '{{ $.identify-source.source }}',
              query: '{{ $.identify-source.formatted_query }}'
            }
          },
          {
            name: 'transform-data',
            action: 'transform_data',
            input: {
              data: '{{ $.fetch-data.raw_data }}',
              format: '{{ $.format }}'
            }
          }
        ]
      }
    ];
    
    for (const workflow of workflowDefinitions) {
      const workflowId = await this.createWorkflow(workflow.name, workflow.description, workflow.steps);
      this.workflowIds.set(workflow.name, workflowId);
    }
  }
  
  private async createWorkflow(name: string, description: string, steps: any[]): Promise<string> {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workflows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          steps,
          enabled: true
        })
      });
      
      const data = await response.json() as { success: boolean; errors?: Array<{ message: string }>; result?: { id: string } };
      if (!data.success) {
        throw new Error(`Failed to create workflow: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (!data.result) {
        throw new Error('No result returned from workflow creation');
      }
      
      return data.result.id;
    } catch (error) {
      console.error(`Error creating workflow ${name}:`, error);
      throw error;
    }
  }
  
  // MCP Agent API methods
  
  async processIntent(intent: string, chain: string = 'polygon', contextSources: string[] = []): Promise<{ action: string; params: any }> {
    const workflowId = this.workflowIds.get('process-intent');
    if (!workflowId) {
      throw new Error('Process intent workflow not registered');
    }
    
    // Gather context from sources
    const context = await this.gatherContext(contextSources);
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            intent,
            chain,
            context
          }
        })
      });
      
      const data = await response.json() as { success: boolean; errors?: Array<{ message: string }>; result?: { id: string } };
      if (!data.success) {
        throw new Error(`Workflow execution failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (!data.result) {
        throw new Error('No result returned from workflow execution');
      }
      
      // Wait for workflow completion
      const runId = data.result.id;
      const result = await this.waitForWorkflowCompletion(workflowId, runId);
      
      return result['format-response'];
    } catch (error) {
      console.error('Error processing intent:', error);
      return {
        action: 'error',
        params: { message: `Failed to process intent: ${error instanceof Error ? error.message : String(error)}` }
      };
    }
  }
  
  async sendCrossChainMessage(message: MCPMessage): Promise<string> {
    const workflowId = this.workflowIds.get('cross-chain-messaging');
    if (!workflowId) {
      throw new Error('Cross-chain messaging workflow not registered');
    }
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            message: message.content,
            source: message.source,
            destination: message.destination,
            private_key: process.env.PRIVATE_KEY || ''
          }
        })
      });
      
      const data = await response.json() as { success: boolean; errors?: Array<{ message: string }>; result?: { id: string } };
      if (!data.success) {
        throw new Error(`Workflow execution failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (!data.result) {
        throw new Error('No result returned from workflow execution');
      }
      
      // Wait for workflow completion
      const runId = data.result.id;
      const result = await this.waitForWorkflowCompletion(workflowId, runId);
      
      return result['send-message'].transaction_hash;
    } catch (error) {
      console.error('Error sending cross-chain message:', error);
      throw error;
    }
  }
  
  async fetchContext(sourceName: string, query: any = {}): Promise<MCPContext | null> {
    const workflowId = this.workflowIds.get('data-fetching');
    if (!workflowId) {
      throw new Error('Data fetching workflow not registered');
    }
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            source_name: sourceName,
            query,
            format: query.format || 'json'
          }
        })
      });
      
      const data = await response.json() as { success: boolean; errors?: Array<{ message: string }>; result?: { id: string } };
      if (!data.success) {
        throw new Error(`Workflow execution failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (!data.result) {
        throw new Error('No result returned from workflow execution');
      }
      
      // Wait for workflow completion
      const runId = data.result.id;
      const result = await this.waitForWorkflowCompletion(workflowId, runId);
      
      return {
        data: result['transform-data'].data,
        metadata: {
          source: sourceName,
          timestamp: Date.now(),
          schema: query.schema
        }
      };
    } catch (error) {
      console.error(`Error fetching context from ${sourceName}:`, error);
      return null;
    }
  }
  
  // Helper methods
  
  private async waitForWorkflowCompletion(workflowId: string, runId: string, maxAttempts = 30): Promise<any> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workflows/${workflowId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      
      const data = await response.json() as { 
        success: boolean; 
        errors?: Array<{ message: string }>; 
        result?: { 
          id: string; 
          status: string; 
          output: any; 
          error?: string 
        } 
      };
      if (!data.success) {
        throw new Error(`Failed to check workflow status: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (data.result && data.result.status === 'completed') {
        return data.result.output;
      } else if (data.result && data.result.status === 'failed') {
        throw new Error(`Workflow execution failed: ${data.result.error || 'Unknown error'}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Workflow execution timed out');
  }
  
  private async gatherContext(contextSources: string[]): Promise<Record<string, any>> {
    const context: Record<string, any> = {};
    
    if (contextSources.length > 0) {
      for (const source of contextSources) {
        const sourceData = await this.fetchContext(source);
        if (sourceData) {
          context[source] = sourceData.data;
        }
      }
    }
    
    return context;
  }
  
  // Data source management
  
  registerDataSource(source: MCPDataSource): void {
    this.dataSources.set(source.id, source);
    console.log(`Registered data source: ${source.id} (${source.type})`);
  }

  getDataSource(id: string): MCPDataSource | undefined {
    return this.dataSources.get(id);
  }

  listDataSources(): MCPDataSource[] {
    return Array.from(this.dataSources.values());
  }
}

export const createCloudflareAgent = async (apiToken: string, accountId: string, ctx: any = {}): Promise<CloudflareMCPAgent> => {
  const agent = new CloudflareMCPAgent(apiToken, accountId, ctx);
  return await agent.initialize();
};
