
const hre = require("hardhat");

async function main() {
  console.log("Deploying Blockable contracts...");

  // Deploy the Blockable contract
  const Blockable = await hre.ethers.getContractFactory("Blockable");
  const blockable = await Blockable.deploy();
  await blockable.waitForDeployment();
  
  const blockableAddress = await blockable.getAddress();
  console.log(`Blockable deployed to: ${blockableAddress}`);

  // For cross-chain functionality (this would need actual Hyperlane addresses)
  const mailboxAddress = process.env.HYPERLANE_MAILBOX || "0x0000000000000000000000000000000000000000";
  const gasPaymasterAddress = process.env.HYPERLANE_GAS_PAYMASTER || "0x0000000000000000000000000000000000000000";
  
  const BlockableRegistry = await hre.ethers.getContractFactory("BlockableRegistry");
  const registry = await BlockableRegistry.deploy(mailboxAddress, gasPaymasterAddress);
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  console.log(`BlockableRegistry deployed to: ${registryAddress}`);
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
