
import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';

const chainOptions = [
  { id: 1, name: 'Ethereum', domain: 1 },
  { id: 2, name: 'Polygon', domain: 137 },
  { id: 3, name: 'HashKey', domain: 1010 },
  { id: 4, name: 'Binance Smart Chain', domain: 56 },
  { id: 5, name: 'Arbitrum', domain: 42161 },
  { id: 6, name: 'Optimism', domain: 10 },
];

export default function CrossChainPanel() {
  const [destinationChain, setDestinationChain] = useState(chainOptions[1]);
  const [message, setMessage] = useState('');
  const [value, setValue] = useState('0.01');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ type: 'idle' });
  
  const fetcher = useFetcher();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStatus({ type: 'loading' });
    
    fetcher.submit(
      {
        action: 'cross_chain_message',
        data: JSON.stringify({
          destinationDomain: destinationChain.domain,
          message,
          value
        })
      },
      { method: 'post', action: '/api/blockchain' }
    );
  };
  
  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setStatus({ 
          type: 'success', 
          message: `Message sent to ${destinationChain.name}! Transaction hash: ${fetcher.data.result.transactionHash}`
        });
        // Reset form
        setMessage('');
      } else {
        setStatus({ 
          type: 'error', 
          message: fetcher.data.error || 'Failed to send cross-chain message'
        });
      }
    }
  }, [fetcher.data, destinationChain.name]);
  
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Cross-Chain Messaging</h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Send messages across different blockchain networks using Hyperlane's Open Intents Framework.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="destination-chain" className="block text-sm font-medium mb-1">
            Destination Chain
          </label>
          <select
            id="destination-chain"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
            value={destinationChain.id}
            onChange={(e) => {
              const selected = chainOptions.find(chain => chain.id === Number(e.target.value));
              if (selected) setDestinationChain(selected);
            }}
          >
            {chainOptions.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your cross-chain message"
            required
          />
        </div>
        
        <div>
          <label htmlFor="value" className="block text-sm font-medium mb-1">
            Value (ETH)
          </label>
          <input
            id="value"
            type="number"
            step="0.001"
            min="0.001"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={fetcher.state === 'submitting'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
        >
          {fetcher.state === 'submitting' ? 'Sending...' : 'Send Cross-Chain Message'}
        </button>
      </form>
      
      {status.type !== 'idle' && (
        <div className={`mt-4 p-3 rounded-md ${
          status.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          status.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
