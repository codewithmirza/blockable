import { BlockchainService } from '../blockchain';
import { ethers } from 'ethers';
import { Agent } from 'agents';

// Define Agent environment and state types
interface MCPAgentEnv {
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  AI?: any;
}

interface MCPAgentState {
  initialized: boolean;
  dataSources: Record<string, MCPDataSource>;
  subscriptions: Record<string, MCPSubscription>;
  contextCache: Record<string, MCPContext>;
}

// Define Model Context Protocol interfaces
export interface MCPMessage {
  source: string;
  destination: string;
  content: any;
  metadata: {
    timestamp: number;
    signature?: string;
    type: 'intent' | 'data' | 'command';
  };
}

export interface MCPDataSource {
  id: string;
  type: 'onchain' | 'api' | 'filesystem' | 'social';
  config: any;
  lastUpdated: number;
}

export interface MCPSubscription {
  id: string;
  sourceName: string;
  filters: any;
  active: boolean;
}

export interface MCPContext {
  data: any;
  metadata: {
    source: string;
    timestamp: number;
    schema?: string;
  };
}

export class MCPAgent extends Agent<MCPAgentEnv, MCPAgentState> {
  private blockchainService: BlockchainService | null = null;
  private dataSources: Map<string, MCPDataSource> = new Map();
  private subscriptions: Map<string, MCPSubscription> = new Map();
  private contextCache: Map<string, MCPContext> = new Map();
  
  constructor(ctx: any = {}, env: MCPAgentEnv = {}) {
    super(ctx, env);
    // No longer initialize ai property here
  }

  async initialize(config: any) {
    const { createBlockchainService } = await import('../blockchain');
    this.blockchainService = createBlockchainService({
      rpcUrl: config.rpcUrl || 'https://rpc.ankr.com/polygon_mumbai',
      privateKey: config.privateKey,
      blockableAddress: config.blockableAddress,
      registryAddress: config.registryAddress
    });
    
    // Register default data sources for Polygon
    this.registerDataSource({
      id: 'polygon-onchain',
      type: 'onchain',
      config: {
        rpcUrl: 'https://rpc.ankr.com/polygon_mumbai',
        chainId: 80001
      },
      lastUpdated: Date.now()
    });

    this.registerDataSource({
      id: 'polygon-transactions',
      type: 'api',
      config: {
        url: 'https://api-testnet.polygonscan.com/api',
        apiKey: config.polygonscanApiKey || ''
      },
      lastUpdated: Date.now()
    });
    
    return this;
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

  // Subscription management
  createSubscription(sourceName: string, filters: any = {}): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.subscriptions.set(id, {
      id,
      sourceName,
      filters,
      active: true
    });
    
    console.log(`Created subscription ${id} to source ${sourceName}`);
    return id;
  }

  updateSubscription(id: string, updates: Partial<MCPSubscription>): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return false;
    
    Object.assign(subscription, updates);
    this.subscriptions.set(id, subscription);
    return true;
  }

  deleteSubscription(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  // Context fetching and management
  async fetchContext(sourceName: string, query: any = {}): Promise<MCPContext | null> {
    const source = this.dataSources.get(sourceName);
    if (!source) {
      throw new Error(`Data source not found: ${sourceName}`);
    }
    
    try {
      let contextData: any;
      
      if (source.type === 'onchain') {
        contextData = await this.fetchOnChainData(source, query);
      } else if (source.type === 'api') {
        contextData = await this.fetchApiData(source, query);
      } else if (source.type === 'filesystem') {
        contextData = await this.fetchFileSystemData(source, query);
      } else if (source.type === 'social') {
        contextData = await this.fetchSocialData(source, query);
      } else {
        throw new Error(`Unsupported data source type: ${source.type}`);
      }
      
      const context: MCPContext = {
        data: contextData,
        metadata: {
          source: sourceName,
          timestamp: Date.now(),
          schema: query.schema
        }
      };
      
      // Cache the context
      const cacheKey = `${sourceName}:${JSON.stringify(query)}`;
      this.contextCache.set(cacheKey, context);
      
      return context;
    } catch (error) {
      console.error(`Error fetching context from ${sourceName}:`, error);
      return null;
    }
  }
  
  // Intent processing with context awareness
  async processIntent(intent: string, chain: string = 'polygon', contextSources: string[] = []): Promise<{ action: string; params: any }> {
    // Fetch relevant context if provided
    const contextData: Record<string, any> = {};
    
    if (contextSources.length > 0) {
      for (const source of contextSources) {
        const context = await this.fetchContext(source);
        if (context) {
          contextData[source] = context.data;
        }
      }
    }
    
    // Create a context-aware prompt with chain-specific information
    let contextPrompt = '';
    if (Object.keys(contextData).length > 0) {
      contextPrompt = `\nAvailable context:\n${JSON.stringify(contextData, null, 2)}`;
    }
    
    // Add chain-specific context
    let chainContext = '';
    if (chain === 'polygon') {
      chainContext = `You are working with Polygon, which provides:
- AggLayer for aggregated blockchains
- Ethereum security
- Support for real-world asset tokenization
- Tools like Polygon PoS, zkEVM, and Polygon CDK`;
    } else if (chain === 'hashkey') {
      chainContext = `You are working with HashKey Chain, which provides:
- Licensed compliance for blockchain applications
- KYC/AML integration capabilities
- Regulatory framework for digital assets
- Support for compliant real-world asset (RWA) tokenization
- Identity systems with regulatory approval`;
    } else if (chain === 'hyperlane') {
      chainContext = `You are working with Hyperlane, which provides:
- Interoperability layer to connect any blockchain permissionlessly
- Support for interchain function calls and asset transfers
- Modular security stack that allows customizing security protocols
- Cross-chain messaging capabilities`;
    }
    
    try {
      // Use env.AI directly instead of the Agent class from @cloudflare/ai
      const response = await fetch('https://api.cloudflare.com/client/v4/accounts/ai/run/@cf/meta/llama-3-8b-instruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Parse the following user intent into structured blockchain action.${contextPrompt}
            
            ${chainContext}
            
            Intent: "${intent}"
            
            Return a JSON object with 'action' and 'params' fields that map this intent to one of:
            1. deploy_contract
            2. generate_contract
            3. create_artifact
            4. send_cross_chain_message
            5. register_intent
            6. query_onchain_data
            7. execute_transaction
            8. setup_compliance
            9. tokenize_asset
            10. create_kyc_process
            
            For example:
            { 
              "action": "generate_contract", 
              "params": { 
                "contractType": "ERC721", 
                "features": ["mintable", "burnable"] 
              } 
            }`
          }]
        })
      });
      
      const result = await response.json() as { result?: { response?: string } };
      
      // Extract response from result
      if (result.result && result.result.response) {
        return JSON.parse(result.result.response);
      } else {
        throw new Error("Invalid AI response format");
      }
    } catch (e) {
      console.error("Failed to process or parse AI response:", e);
      return {
        action: "unknown",
        params: { error: "Failed to parse intent", chain }
      };
    }
  }

  // Cross-chain messaging using Hyperlane
  async sendCrossChainMessage(message: MCPMessage): Promise<string> {
    if (!this.blockchainService) {
      throw new Error("MCP agent not initialized");
    }
    
    // Convert destination to domain ID
    const destinationDomain = this.getChainDomainId(message.destination);
    
    // Format message for cross-chain transmission
    const serializedMessage = JSON.stringify(message);
    
    // Use Hyperlane's cross-chain messaging
    return await this.blockchainService.sendCrossChainMessage(
      destinationDomain,
      serializedMessage,
      '0.01' // Default gas value
    );
  }
  
  // Intent registration with Open Intents Framework
  async registerIntent(intent: string, chainName: string): Promise<string> {
    if (!this.blockchainService) {
      throw new Error("MCP agent not initialized");
    }
    
    const parsedIntent = await this.processIntent(intent);
    
    // Create an intent data structure compatible with Open Intents Framework
    const intentData = {
      description: intent,
      action: parsedIntent.action,
      params: parsedIntent.params,
      chain: chainName,
      timestamp: Date.now()
    };
    
    // Register the intent using Hyperlane's Open Intents Framework
    return await this.blockchainService.registerIntent(intentData);
  }
  
  // Fetch data from different source types
  private async fetchOnChainData(source: MCPDataSource, query: any): Promise<any> {
    if (!this.blockchainService) {
      throw new Error("Blockchain service not initialized");
    }
    
    const { rpcUrl, chainId } = source.config;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (query.type === 'balance') {
      const balance = await provider.getBalance(query.address);
      return { balance: ethers.formatEther(balance) };
    } else if (query.type === 'contract') {
      // Call a contract method
      const contract = new ethers.Contract(query.address, query.abi, provider);
      const result = await contract[query.method](...(query.params || []));
      return { contractData: result };
    } else if (query.type === 'block') {
      const block = await provider.getBlock(query.blockNumber || 'latest');
      return { block };
    } else if (query.type === 'transaction') {
      const tx = await provider.getTransaction(query.txHash);
      return { transaction: tx };
    }
    
    throw new Error(`Unsupported onchain query type: ${query.type}`);
  }
  
  private async fetchApiData(source: MCPDataSource, query: any): Promise<any> {
    const { url, apiKey } = source.config;
    
    // Construct the API URL with query parameters
    let apiUrl = url;
    const params = new URLSearchParams();
    
    if (apiKey) {
      params.append('apiKey', apiKey);
    }
    
    // Add query-specific parameters
    if (query.type === 'address') {
      params.append('module', 'account');
      params.append('action', 'txlist');
      params.append('address', query.address);
    } else if (query.type === 'token') {
      params.append('module', 'token');
      params.append('action', 'tokeninfo');
      params.append('contractaddress', query.address);
    }
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async fetchFileSystemData(source: MCPDataSource, query: any): Promise<any> {
    // Stub implementation - in a real environment, you'd access files
    return { message: "File system access not available in this environment" };
  }
  
  private async fetchSocialData(source: MCPDataSource, query: any): Promise<any> {
    // Stub implementation - would connect to social APIs
    return { message: "Social data fetching not implemented" };
  }
  
  private getChainDomainId(chainName: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'polygon': 137,
      'hashkey': 1010,
      'mumbai': 80001,
      'goerli': 5,
      'arbitrum': 42161,
      'optimism': 10,
      'base': 8453
    };
    
    return chainMap[chainName.toLowerCase()] || 137; // Default to Polygon if not found
  }
}

export const mcpAgent = new MCPAgent();
