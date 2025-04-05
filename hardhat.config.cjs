require("@nomicfoundation/hardhat-ethers");
require('dotenv').config({ path: '.env' });

// Define Hyperlane addresses for various networks
const HYPERLANE_ADDRESSES = {
  mumbai: {
    mailbox: "0xCC737a94FecaeC165AbCf12dED095BB13F037685",
    gasPaymaster: "0x8f9C3888bFC8a5B25AED115A82eCbb788b196d2a"
  },
  sepolia: {
    mailbox: "0xCC737a94FecaeC165AbCf12dED095BB13F037685", 
    gasPaymaster: "0x8f9C3888bFC8a5B25AED115A82eCbb788b196d2a"
  }
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://matic-mumbai.chainstacklabs.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      timeout: 100000,
      hyperlane: HYPERLANE_ADDRESSES.mumbai,
      verify: {
        etherscan: {
          apiUrl: "https://api-testnet.polygonscan.com/",
          apiKey: process.env.POLYGONSCAN_API_KEY || ""
        }
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      hyperlane: HYPERLANE_ADDRESSES.sepolia,
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.etherscan.io/",
          apiKey: process.env.ETHERSCAN_API_KEY || ""
        }
      }
    }
  },
  paths: {
    artifacts: "./app/artifacts",
  }
};
