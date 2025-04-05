import { useAddress, useChainId, useBalance } from "@thirdweb-dev/react";
import { useEffect, useState } from 'react';

export default function BlockchainPreview() {
  const address = useAddress();
  const chainId = useChainId();
  const { data: balance } = useBalance();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (!address) {
    return (
      <div className="blockchain-preview-container">
        <div className="blockchain-preview-alert">
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view blockchain details and interact with contracts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-preview-container">
      <div className="blockchain-account-section">
        <h3>Account Information</h3>
        <div className="blockchain-info-row">
          <span className="blockchain-info-label">Address:</span>
          <span className="blockchain-info-value">{address}</span>
        </div>
        <div className="blockchain-info-row">
          <span className="blockchain-info-label">Chain ID:</span>
          <span className="blockchain-info-value">{chainId}</span>
        </div>
        <div className="blockchain-info-row">
          <span className="blockchain-info-label">Balance:</span>
          <span className="blockchain-info-value">
            {balance ? `${balance.displayValue} ${balance.symbol}` : "Loading..."}
          </span>
        </div>
      </div>

      <div className="blockchain-network-section">
        <h3>Network Integrations</h3>
        <div className="blockchain-network-cards">
          <div className="blockchain-network-card">
            <h4>Polygon</h4>
            <p>Layer 2 scaling solution with low fees</p>
          </div>
          <div className="blockchain-network-card">
            <h4>HashKey Chain</h4>
            <p>Comprehensive blockchain platform with KYC</p>
          </div>
          <div className="blockchain-network-card">
            <h4>Hyperlane</h4>
            <p>Interoperability layer for cross-chain operations</p>
          </div>
        </div>
      </div>
    </div>
  );
}