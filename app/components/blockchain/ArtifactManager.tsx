
import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';

export default function ArtifactManager() {
  const [recipient, setRecipient] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const fetcher = useFetcher();
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    setResult(null);
    
    fetcher.submit(
      {
        action: 'create_artifact',
        data: JSON.stringify({
          recipient,
          tokenURI,
          metadataHash: metadataHash || `0x${Array(64).fill('0').join('')}`
        })
      },
      { method: 'post', action: '/api/blockchain' }
    );
  };
  
  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsFetching(true);
    setResult(null);
    
    fetcher.submit(
      {
        action: 'get_artifact',
        data: JSON.stringify({
          tokenId: parseInt(tokenId)
        })
      },
      { method: 'post', action: '/api/blockchain' }
    );
  };
  
  React.useEffect(() => {
    if (fetcher.data) {
      setIsCreating(false);
      setIsFetching(false);
      
      if (fetcher.data.success) {
        setResult(fetcher.data.result);
        
        // If artifact was created, store the token ID
        if (fetcher.data.result.tokenId) {
          setTokenId(fetcher.data.result.tokenId.toString());
        }
      } else {
        setResult({ error: fetcher.data.error || 'An error occurred' });
      }
    }
  }, [fetcher.data]);
  
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Regulatory-Compliant Artifact Manager</h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Create and manage tokenized artifacts with HashKey's regulatory-compliant framework.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Create New Artifact</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium mb-1">
                Recipient Address
              </label>
              <input
                id="recipient"
                type="text"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="token-uri" className="block text-sm font-medium mb-1">
                Token URI
              </label>
              <input
                id="token-uri"
                type="text"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
                value={tokenURI}
                onChange={(e) => setTokenURI(e.target.value)}
                placeholder="ipfs://..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="metadata-hash" className="block text-sm font-medium mb-1">
                Metadata Hash (optional)
              </label>
              <input
                id="metadata-hash"
                type="text"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
                value={metadataHash}
                onChange={(e) => setMetadataHash(e.target.value)}
                placeholder="0x..."
              />
            </div>
            
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Artifact'}
            </button>
          </form>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Fetch Artifact</h3>
          <form onSubmit={handleFetch} className="space-y-4">
            <div>
              <label htmlFor="token-id" className="block text-sm font-medium mb-1">
                Token ID
              </label>
              <input
                id="token-id"
                type="number"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="1"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isFetching}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
            >
              {isFetching ? 'Fetching...' : 'Fetch Artifact'}
            </button>
          </form>
          
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Artifact Information</h4>
            {result && (
              <div className={`p-3 rounded-md ${
                result.error 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-zinc-100 dark:bg-zinc-900'
              }`}>
                {result.error ? (
                  <p>{result.error}</p>
                ) : (
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
