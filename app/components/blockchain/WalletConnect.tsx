import { useEffect, useState } from 'react';
import { useConnect, useDisconnect, useAddress, useChain, useSwitchChain } from "@thirdweb-dev/react";
import '../../styles/components/wallet.scss';

export default function WalletConnect() {
  const address = useAddress();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const chain = useChain();
  const switchChain = useSwitchChain();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async () => {
    await connect();

    // Create or update user session on successful connection
    if (address) {
      try {
        await fetch('/api/syncchat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: address,
            action: 'createSession'
          }),
        });
      } catch (error) {
        console.error('Error creating user session:', error);
      }
    }
  };


  if (!isClient) return null;

  return (
    <div className="wallet-connect-container">
      {address ? (
        <div className="wallet-info">
          <div className="wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="wallet-chain">
            {chain?.name || "Unknown chain"}
          </div>
          <button 
            className="wallet-disconnect-btn" 
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          className="wallet-connect-btn" 
          onClick={() => handleConnect()} // Use handleConnect instead of connect
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}