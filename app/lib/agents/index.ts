
import { Agent } from '@cloudflare/ai';
import { WebSocket } from '@cloudflare/workers-types';

export interface AgentTask {
  type: string;
  input: any;
}

export class AgentManager {
  private agents: Map<string, BaseAgent>;
  private connections: Map<string, WebSocket>;
  private mcpInitialized: boolean = false;
  private cfAgentIds: Map<string, string> = new Map();
  private workflowIds: Map<string, string> = new Map();

  constructor() {
    this.agents = new Map();
    this.connections = new Map();
    this.initializeAgents();
  }

  private async initializeAgents() {
    this.agents.set('blockchain', new BlockchainAgent());
    this.agents.set('frontend', new FrontendAgent());
    this.agents.set('security', new SecurityAgent());
    this.agents.set('testing', new TestingAgent());
    this.agents.set('chat', new ChatAgent());
    this.agents.set('mcp', new MCPAgent());
    
    // Initialize Cloudflare Agents
    await this.initializeCloudflareAgents();
  }
  
  private async initializeCloudflareAgents() {
    try {
      // Register Cloudflare Agents for different specialties
      const blockchainAgentId = await this.registerCloudflareAgent('blockchain-specialist', {
        capabilities: ['smart_contract_generation', 'blockchain_integration', 'web3_security'],
        description: 'Specialist in blockchain technologies and smart contract development'
      });
      
      const frontendAgentId = await this.registerCloudflareAgent('frontend-specialist', {
        capabilities: ['ui_generation', 'react_development', 'css_optimization'],
        description: 'Expert in frontend development and UI/UX implementation'
      });
      
      const securityAgentId = await this.registerCloudflareAgent('security-specialist', {
        capabilities: ['code_audit', 'vulnerability_detection', 'security_best_practices'],
        description: 'Security specialist for code and infrastructure auditing'
      });
      
      // Store agent IDs for later use
      this.cfAgentIds.set('blockchain', blockchainAgentId);
      this.cfAgentIds.set('frontend', frontendAgentId);
      this.cfAgentIds.set('security', securityAgentId);
      
      // Create Cloudflare Workflows for common tasks
      await this.setupWorkflows();
      
    } catch (error) {
      console.error("Failed to initialize Cloudflare Agents:", error);
    }
  }
  
  private async registerCloudflareAgent(name: string, config: any): Promise<string> {
    try {
      // Call Cloudflare API to register a new agent
      const response = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/agents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: config.description,
          capabilities: config.capabilities,
          model: '@cf/meta/llama-3-8b-instruct'
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Failed to register Cloudflare Agent: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      return data.result.id;
    } catch (error) {
      console.error(`Error registering Cloudflare Agent ${name}:`, error);
      return '';
    }
  }
  
  private async setupWorkflows() {
    try {
      // Register common workflows
      const deployContractWorkflowId = await this.createWorkflow('deploy-contract', [
        {
          action: 'compile_contract',
          input: {
            source: '{{ $.contract.source }}',
            compiler: '{{ $.contract.compiler }}'
          }
        },
        {
          action: 'security_audit',
          input: {
            contract: '{{ $.compiled_contract }}'
          }
        },
        {
          action: 'deploy',
          input: {
            contract: '{{ $.compiled_contract }}',
            network: '{{ $.network }}',
            private_key: '{{ $.private_key }}'
          }
        }
      ]);
      
      const crossChainWorkflowId = await this.createWorkflow('cross-chain-message', [
        {
          action: 'prepare_message',
          input: {
            message: '{{ $.message }}',
            source_chain: '{{ $.source_chain }}',
            target_chain: '{{ $.target_chain }}'
          }
        },
        {
          action: 'validate_message',
          input: {
            prepared_message: '{{ $.prepared_message }}'
          }
        },
        {
          action: 'send_message',
          input: {
            message: '{{ $.prepared_message }}',
            destination: '{{ $.target_chain }}'
          }
        }
      ]);
      
      this.workflowIds.set('deploy-contract', deployContractWorkflowId);
      this.workflowIds.set('cross-chain-message', crossChainWorkflowId);
      
    } catch (error) {
      console.error("Failed to set up Cloudflare Workflows:", error);
    }
  }
  
  private async createWorkflow(name: string, steps: any[]): Promise<string> {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: `Workflow for ${name}`,
          steps,
          enabled: true
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Failed to create workflow: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      return data.result.id;
    } catch (error) {
      console.error(`Error creating workflow ${name}:`, error);
      return '';
    }
  }
  
  async initializeMCP(config: any) {
    if (this.mcpInitialized) return;
    
    try {
      const { mcpAgent } = await import('./mcp');
      await mcpAgent.initialize(config);
      this.mcpInitialized = true;
    } catch (error) {
      console.error("Failed to initialize MCP agent:", error);
    }
  }

  async getAgent(agentName: string) {
    if (agentName === 'mcp' && !this.mcpInitialized) {
      await this.initializeMCP({
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        privateKey: 'dummy-key-for-example'
      });
    }
    
    const { mcpAgent } = await import('./mcp');
    return mcpAgent;
  }

  async executeTask(agentName: string, task: AgentTask) {
    // First try to execute with Cloudflare Agent if available
    const cfAgentId = this.cfAgentIds.get(agentName);
    if (cfAgentId) {
      try {
        return await this.executeCloudflareAgentTask(cfAgentId, task);
      } catch (error) {
        console.warn(`Cloudflare Agent execution failed, falling back to local agent: ${error.message}`);
      }
    }
    
    // Fallback to local agent
    const agent = this.agents.get(agentName);
    if (!agent) throw new Error(`Agent ${agentName} not found`);
    return await agent.execute(task);
  }
  
  async executeCloudflareAgentTask(agentId: string, task: AgentTask): Promise<any> {
    try {
      // Check if we should use a workflow instead
      if (task.type === 'deploy_contract' && this.workflowIds.get('deploy-contract')) {
        return await this.executeWorkflow('deploy-contract', task.input);
      } else if (task.type === 'send_cross_chain_message' && this.workflowIds.get('cross-chain-message')) {
        return await this.executeWorkflow('cross-chain-message', task.input);
      }
      
      // Execute with direct agent API call
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/{account_id}/agents/${agentId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: task.input,
          task_type: task.type
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Agent execution failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      return data.result.output;
    } catch (error) {
      console.error(`Error executing Cloudflare Agent task:`, error);
      throw error;
    }
  }
  
  async executeWorkflow(workflowName: string, input: any): Promise<any> {
    const workflowId = this.workflowIds.get(workflowName);
    if (!workflowId) {
      throw new Error(`Workflow ${workflowName} not found`);
    }
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Workflow execution failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      // For synchronous execution, wait for the workflow to complete
      const runId = data.result.id;
      return await this.waitForWorkflowCompletion(workflowId, runId);
    } catch (error) {
      console.error(`Error executing workflow ${workflowName}:`, error);
      throw error;
    }
  }
  
  private async waitForWorkflowCompletion(workflowId: string, runId: string, maxAttempts = 30): Promise<any> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows/${workflowId}/runs/${runId}`, {
        headers: {
          'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN
        }
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Failed to check workflow status: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
      
      if (data.result.status === 'completed') {
        return data.result.output;
      } else if (data.result.status === 'failed') {
        throw new Error(`Workflow execution failed: ${data.result.error || 'Unknown error'}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Workflow execution timed out');
  }

  addConnection(id: string, ws: WebSocket) {
    this.connections.set(id, ws);
  }
}

abstract class BaseAgent {
  protected ai: Agent;
  
  constructor() {
    this.ai = new Agent({
      binding: 'AI',
      model: '@cf/meta/llama-3-8b-instruct'
    });
  }

  abstract execute(task: AgentTask): Promise<any>;
}

class BlockchainAgent extends BaseAgent {
  private blockchainService: any;

  constructor() {
    super();
    // Initialize in execute to ensure it's created only when needed
    this.blockchainService = null;
  }

  async execute(task: AgentTask) {
    // Initialize blockchain service if not already done
    if (!this.blockchainService) {
      const { createBlockchainService } = await import('../blockchain');
      this.blockchainService = createBlockchainService({
        rpcUrl: task.input.rpcUrl || 'https://rpc-mumbai.maticvigil.com',
        privateKey: task.input.privateKey,
        blockableAddress: task.input.blockableAddress,
        registryAddress: task.input.registryAddress
      });
    }

    switch (task.type) {
      case 'generate_contract':
        return await this.generateContract(task.input);
      case 'deploy_contract':
        return await this.deployContract(task.input);
      case 'audit_contract':
        return await this.auditContract(task.input);
      case 'create_artifact':
        return await this.createArtifact(task.input);
      case 'get_artifact':
        return await this.getArtifact(task.input);
      case 'cross_chain_message':
        return await this.sendCrossChainMessage(task.input);
      case 'process_intent':
        return await this.processIntent(task.input);
      case 'setup_compliance':
        return await this.setupCompliance(task.input);
      case 'tokenize_asset':
        return await this.tokenizeAsset(task.input);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
  
  // Process user intent using the MCP agent
  private async processIntent(input: any) {
    const { mcpAgent } = await import('./mcp');
    await mcpAgent.initialize({
      rpcUrl: input.rpcUrl,
      privateKey: input.privateKey,
      polygonscanApiKey: input.apiKey
    });
    
    return await mcpAgent.processIntent(input.intent, input.chain, input.contextSources || []);
  }
  
  // Set up compliance processes for HashKey Chain
  private async setupCompliance(input: any) {
    // This would integrate with HashKey Chain's compliance tools
    return {
      status: 'success',
      message: 'Compliance setup initialized',
      details: {
        kycIntegrated: true,
        regulatoryFramework: input.framework || 'default',
        complianceLevel: input.level || 'standard'
      }
    };
  }
  
  // Tokenize real-world assets
  private async tokenizeAsset(input: any) {
    // This would handle asset tokenization across different chains
    const { assetType, assetValue, chain } = input;
    
    // Chain-specific tokenization logic would go here
    const tokenizationDetails = {
      assetType,
      assetValue,
      chain,
      tokenId: `${chain}_${Date.now()}`,
      status: 'pending_verification'
    };
    
    return {
      status: 'success',
      message: `Asset tokenization initiated on ${chain}`,
      details: tokenizationDetails
    };
  }

  private async generateContract(spec: any) {
    // Implementation using AI for contract generation
    const result = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ 
        role: 'user', 
        content: `Generate a Solidity smart contract with the following specifications: ${JSON.stringify(spec)}. 
                  Include detailed comments and focus on security best practices.` 
      }]
    });
    
    return {
      contract: result.response,
      analysis: await this.auditContract({ contract: result.response })
    };
  }

  private async deployContract(contract: any) {
    try {
      // Use ethers to compile and deploy the contract
      const address = await this.blockchainService.deployBlockable();
      
      return { 
        status: 'deployed', 
        address: address,
        network: contract.network || 'mumbai',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async auditContract(input: any) {
    // Implementation for security audit
    const result = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ 
        role: 'user', 
        content: `
          Perform a security audit on the following smart contract. 
          Identify any vulnerabilities related to:
          1. Reentrancy
          2. Integer overflow/underflow
          3. Access control issues
          4. Gas optimization
          5. Logic errors
          
          Contract code:
          ${input.contract}
          
          Provide a severity rating (Low, Medium, High, Critical) for each issue found.
        `
      }]
    });
    
    return {
      audit_result: result.response,
      timestamp: new Date().toISOString()
    };
  }

  private async createArtifact(input: any) {
    try {
      const { recipient, tokenURI, metadataHash } = input;
      
      const tokenId = await this.blockchainService.createArtifact(
        recipient,
        tokenURI,
        metadataHash
      );
      
      return {
        status: 'success',
        tokenId: tokenId,
        recipient: recipient,
        tokenURI: tokenURI,
        metadataHash: metadataHash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getArtifact(input: any) {
    try {
      const { tokenId } = input;
      
      const metadataHash = await this.blockchainService.getMetadataHash(tokenId);
      
      return {
        status: 'success',
        tokenId: tokenId,
        metadataHash: metadataHash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async sendCrossChainMessage(input: any) {
    try {
      const { destinationDomain, message, value } = input;
      
      const txHash = await this.blockchainService.sendCrossChainMessage(
        destinationDomain,
        message,
        value || '0.01'
      );
      
      return {
        status: 'success',
        transactionHash: txHash,
        destinationDomain: destinationDomain,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

class FrontendAgent extends BaseAgent {
  async execute(task: AgentTask) {
    // Frontend generation/optimization logic
    return await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: `Generate UI component: ${JSON.stringify(task.input)}` }]
    });
  }
}

class SecurityAgent extends BaseAgent {
  async execute(task: AgentTask) {
    // Security audit implementation
    return await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: `Security audit: ${JSON.stringify(task.input)}` }]
    });
  }
}

class TestingAgent extends BaseAgent {
  async execute(task: AgentTask) {
    // Test generation and execution
    return await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: `Generate tests: ${JSON.stringify(task.input)}` }]
    });
  }
}

class ChatAgent extends BaseAgent {
  async execute(task: AgentTask) {
    // Chat interaction implementation
    return await this.ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: task.input }]
    });
  }
}

class MCPAgent extends BaseAgent {
  async execute(task: AgentTask) {
    const { mcpAgent } = await import('./mcp');
    
    switch (task.type) {
      case 'process_intent':
        if (typeof task.input === 'string') {
          return await mcpAgent.processIntent(task.input);
        } else {
          return await mcpAgent.processIntent(task.input.intent, task.input.contextSources);
        }
      case 'send_message':
        return await mcpAgent.sendCrossChainMessage(task.input);
      case 'register_intent':
        return await mcpAgent.registerIntent(task.input.intent, task.input.chainName);
      case 'fetch_context':
        return await mcpAgent.fetchContext(task.input.sourceName, task.input.query);
      case 'list_data_sources':
        return mcpAgent.listDataSources();
      case 'register_data_source':
        mcpAgent.registerDataSource(task.input);
        return { success: true, id: task.input.id };
      case 'create_subscription':
        return mcpAgent.createSubscription(task.input.sourceName, task.input.filters);
      default:
        throw new Error(`Unknown MCP task type: ${task.type}`);
    }
  }
}

export const agentManager = new AgentManager();
