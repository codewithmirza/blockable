
import { ethers } from 'ethers';

// Interface for blockchain service configuration
export interface BlockchainServiceConfig {
  rpcUrl: string;
  privateKey?: string;
  blockableAddress?: string;
  registryAddress?: string;
}

// Interface for cross-chain message
export interface CrossChainMessage {
  destinationDomain: number;
  recipient: string;
  message: string;
  value: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private blockableAddress: string | null = null;
  private registryAddress: string | null = null;

  constructor(config: BlockchainServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    }
    
    this.blockableAddress = config.blockableAddress || null;
    this.registryAddress = config.registryAddress || null;
  }

  // Deploy a new Blockable contract
  async deployBlockable(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Private key required for deployment');
    }

    // Fetch compiled contract bytecode from a hypothetical API or local storage
    const contractBytecode = await this.getContractBytecode('Blockable');
    const contractAbi = await this.getContractAbi('Blockable');
    
    const factory = new ethers.ContractFactory(contractAbi, contractBytecode, this.wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    this.blockableAddress = address;
    
    return address;
  }

  // Create an artifact (NFT) in the Blockable contract
  async createArtifact(recipient: string, tokenURI: string, metadataHash: string): Promise<number> {
    if (!this.wallet) {
      throw new Error('Private key required for creating artifacts');
    }
    
    if (!this.blockableAddress) {
      throw new Error('Blockable contract address not set');
    }
    
    const contractAbi = await this.getContractAbi('Blockable');
    const contract = new ethers.Contract(this.blockableAddress, contractAbi, this.wallet);
    
    const tx = await contract.createArtifact(recipient, tokenURI, metadataHash);
    const receipt = await tx.wait();
    
    // Parse logs to get the tokenId
    const event = receipt.logs.find(log => 
      log.topics[0] === ethers.id('ArtifactCreated(uint256,address,string,bytes32)')
    );
    
    if (event && event.args) {
      return Number(event.args[0]);
    } else {
      // Fallback to getting the last token ID
      const tokenId = await contract.totalSupply();
      return Number(tokenId) - 1;
    }
  }

  // Get metadata hash for a token ID
  async getMetadataHash(tokenId: number): Promise<string> {
    if (!this.blockableAddress) {
      throw new Error('Blockable contract address not set');
    }
    
    const contractAbi = await this.getContractAbi('Blockable');
    const contract = new ethers.Contract(this.blockableAddress, contractAbi, this.provider);
    
    return await contract.getMetadataHash(tokenId);
  }

  // Send a cross-chain message using Hyperlane
  async sendCrossChainMessage(destinationDomain: number, message: string, value: string = '0.01'): Promise<string> {
    if (!this.wallet) {
      throw new Error('Private key required for sending cross-chain messages');
    }
    
    // Get the Hyperlane messaging contract address from registry or config
    const hyperlaneMailboxAddress = await this.getHyperlaneMailboxAddress();
    
    // ABI for Hyperlane Mailbox interface
    const mailboxAbi = [
      'function dispatch(uint32 _destinationDomain, bytes32 _recipientAddress, bytes calldata _messageBody) payable returns (bytes32)',
    ];
    
    const mailbox = new ethers.Contract(hyperlaneMailboxAddress, mailboxAbi, this.wallet);
    
    // Convert message to bytes
    const messageBytes = ethers.toUtf8Bytes(message);
    
    // Convert recipient to bytes32 (placeholder)
    const recipientBytes32 = ethers.zeroPadBytes(ethers.toUtf8Bytes('recipient'), 32);
    
    // Value in Ether
    const valueInEther = ethers.parseEther(value);
    
    // Send the transaction
    const tx = await mailbox.dispatch(
      destinationDomain,
      recipientBytes32,
      messageBytes,
      { value: valueInEther }
    );
    
    const receipt = await tx.wait();
    return receipt.hash;
  }

  // Helper method to register an intent using Open Intents Framework
  async registerIntent(intentData: any): Promise<string> {
    if (!this.wallet) {
      throw new Error('Private key required for registering intents');
    }
    
    // Get the Intent Registry address
    const intentRegistryAddress = await this.getIntentRegistryAddress();
    
    // ABI for Intent Registry interface
    const registryAbi = [
      'function registerIntent(bytes calldata _intentData) returns (bytes32)',
    ];
    
    const registry = new ethers.Contract(intentRegistryAddress, registryAbi, this.wallet);
    
    // Serialize intent data to bytes
    const serializedIntent = ethers.toUtf8Bytes(JSON.stringify(intentData));
    
    // Register the intent
    const tx = await registry.registerIntent(serializedIntent);
    const receipt = await tx.wait();
    
    // Parse logs to get the intent ID
    const event = receipt.logs.find(log => 
      log.topics[0] === ethers.id('IntentRegistered(bytes32,address,bytes)')
    );
    
    if (event && event.args) {
      return event.args[0];
    } else {
      throw new Error('Failed to parse intent ID from logs');
    }
  }

  // Helper methods to get contract information
  private async getContractBytecode(contractName: string): Promise<string> {
    // In a real implementation, this would fetch from an API or local storage
    return '0x608060405234801561001057600080fd5b50610041337fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa6122201561004657600080fd5b6102c8806100566000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063715018a61461003b5780638da5cb5b14610045575b600080fd5b610043610063565b005b61004d6100da565b60405161005a91906101e9565b60405180910390f35b6000806100796000546001600160a01b031690565b6001600160a01b0316146100d8576000546040516001600160a01b038085169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a36000805473ffffffffffffffffffffffffffffffffffffffff191690555b565b6000546001600160a01b031690565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100ed826100c2565b9050919050565b6100fd816100e2565b82525050565b60006020820190506101186000830184610104565b92915050565b600082825260208201905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600060001982141561016f5761016e610139565b5b5050565b600082825260208201905092915050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b60006101bd602083610175565b91506101c882610186565b602082019050919050565b600060208201905081810360008301526101ec816101b0565b905091905056fea2646970667358221220d780104da5622d0c1a22e03a20ef21b27239f1e7d42595b148d2222a86b81f2064736f6c63430008130033';
  }

  private async getContractAbi(contractName: string): Promise<any[]> {
    // In a real implementation, this would fetch from an API or local storage
    return [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "tokenURI",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "metadataHash",
            "type": "bytes32"
          }
        ],
        "name": "createArtifact",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "getMetadataHash",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  private async getHyperlaneMailboxAddress(): Promise<string> {
    // In a real implementation, this would be fetched from a registry or config
    return '0x47e46e67D93A063EaE7Cda58E467E37E86a41c69'; // Example address
  }
  
  private async getIntentRegistryAddress(): Promise<string> {
    // In a real implementation, this would be fetched from a registry or config
    return '0x8B38b97a70D3E510F5dE9B59D687BbCe95A3c93a'; // Example address
  }
}

// Factory function to create a blockchain service
export function createBlockchainService(config: BlockchainServiceConfig): BlockchainService {
  return new BlockchainService(config);
}
