import { createRequire } from 'module';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

dotenv.config();

// Set up a require function for loading hardhat
const require = createRequire(import.meta.url);
const hre = require("hardhat");

// Get directory path for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("Deploying Blockable contracts...");
  console.log(`Network: ${hre.network.name}`);

  // Deploy the Blockable contract
  const Blockable = await hre.ethers.getContractFactory("Blockable");
  const blockable = await Blockable.deploy();
  await blockable.waitForDeployment();
  
  const blockableAddress = await blockable.getAddress();
  console.log(`Blockable deployed to: ${blockableAddress}`);

  // Get Hyperlane addresses from config or use defaults
  const networkConfig = hre.config.networks[hre.network.name];
  const mailboxAddress = (networkConfig?.hyperlane?.mailbox) || 
                         process.env.HYPERLANE_MAILBOX || 
                         "0x0000000000000000000000000000000000000000";
  
  const gasPaymasterAddress = (networkConfig?.hyperlane?.gasPaymaster) || 
                             process.env.HYPERLANE_GAS_PAYMASTER || 
                             "0x0000000000000000000000000000000000000000";
  
  console.log(`Using Hyperlane Mailbox: ${mailboxAddress}`);
  console.log(`Using Hyperlane GasPaymaster: ${gasPaymasterAddress}`);
  
  const BlockableRegistry = await hre.ethers.getContractFactory("BlockableRegistry");
  const registry = await BlockableRegistry.deploy(mailboxAddress, gasPaymasterAddress);
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  console.log(`BlockableRegistry deployed to: ${registryAddress}`);
  
  // Write contract addresses to .env file for later use
  const envVars = `
# Contract addresses deployed on ${hre.network.name} at ${new Date().toISOString()}
BLOCKABLE_ADDRESS=${blockableAddress}
REGISTRY_ADDRESS=${registryAddress}
`;

  try {
    // Append to existing .env file or create if doesn't exist
    const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
    
    // Remove existing contract addresses if any
    let updatedEnvFile = envFile
      .replace(/BLOCKABLE_ADDRESS=.*/g, '')
      .replace(/REGISTRY_ADDRESS=.*/g, '');
      
    // Append new addresses
    updatedEnvFile += envVars;
    
    fs.writeFileSync('.env', updatedEnvFile);
    console.log('Contract addresses written to .env file');
  } catch (error) {
    console.warn('Failed to write contract addresses to .env file:', error);
  }
  
  console.log("Deployment complete!");
}

// Execute main function and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
