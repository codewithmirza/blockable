import React, { useState } from 'react';
import { useContract, useContractWrite } from '@thirdweb-dev/react';

interface CrossChainResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default function CrossChainPanel() {
  const [sourceChain, setSourceChain] = useState('polygon');
  const [destinationChain, setDestinationChain] = useState('mumbai');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { contract } = useContract(import.meta.env.VITE_BLOCKABLE_REGISTRY);
  const { mutateAsync: sendCrossChainMessage } = useContractWrite(contract as any, "sendCrossChainMessage");

  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      // Get domain IDs for the chains
      const sourceDomain = getDomainId(sourceChain);
      const destinationDomain = getDomainId(destinationChain);

      // Send the cross-chain message
      await sendCrossChainMessage({
        args: [
          destinationDomain,
          message,
          { value: '0.01' } // Include some gas for the destination chain
        ]
      } as any);
    } catch (error) {
      console.error('Error sending cross-chain message:', error);
    }
    setIsSending(false);
  };

  const getDomainId = (chain: string): number => {
    const domainIds: Record<string, number> = {
      'polygon': 137,
      'mumbai': 80001,
      'sepolia': 11155111
    };
    return domainIds[chain] || 0;
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Cross-Chain Communication</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Source Chain</label>
            <select
              className="w-full p-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
              value={sourceChain}
              onChange={(e) => setSourceChain(e.target.value)}
            >
              <option value="polygon">Polygon</option>
              <option value="mumbai">Mumbai</option>
              <option value="sepolia">Sepolia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destination Chain</label>
            <select
              className="w-full p-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
              value={destinationChain}
              onChange={(e) => setDestinationChain(e.target.value)}
            >
              <option value="polygon">Polygon</option>
              <option value="mumbai">Mumbai</option>
              <option value="sepolia">Sepolia</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            className="w-full h-32 p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your cross-chain message..."
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isSending}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
}
