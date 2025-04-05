
import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import CodeBlock from '../chat/CodeBlock';

export default function ContractGenerator() {
  const [contractSpec, setContractSpec] = useState('');
  const [generatedContract, setGeneratedContract] = useState('');
  const [auditResult, setAuditResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fetcher = useFetcher();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setGeneratedContract('');
    setAuditResult('');
    
    fetcher.submit(
      {
        action: 'generate_contract',
        data: JSON.stringify({
          name: 'CustomContract',
          description: contractSpec,
          features: [
            'ERC20',
            'ERC721',
            'Access Control',
            'Polygon Compatible',
            'HashKey Compliance'
          ].filter(() => Math.random() > 0.5) // Randomly select features for demo
        })
      },
      { method: 'post', action: '/api/blockchain' }
    );
  };
  
  React.useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);
      
      if (fetcher.data.success && fetcher.data.result) {
        setGeneratedContract(fetcher.data.result.contract);
        setAuditResult(fetcher.data.result.analysis.audit_result);
      }
    }
  }, [fetcher.data]);
  
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">AI Smart Contract Generator</h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Generate smart contracts using AI. Specify your requirements and our AI will generate a contract with comments and security best practices.
      </p>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="contract-spec" className="block text-sm font-medium mb-1">
          Contract Specifications
        </label>
        <textarea
          id="contract-spec"
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 mb-4"
          rows={6}
          value={contractSpec}
          onChange={(e) => setContractSpec(e.target.value)}
          placeholder="Describe your smart contract requirements. For example: An ERC721 NFT contract with royalty features, minting caps, and access control."
          required
        />
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Contract'}
        </button>
      </form>
      
      {generatedContract && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Generated Contract</h3>
          <CodeBlock language="solidity" code={generatedContract} />
          
          <h3 className="text-lg font-medium mt-6 mb-2">Security Audit</h3>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-auto whitespace-pre-wrap">
            {auditResult}
          </div>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                fetcher.submit(
                  {
                    action: 'deploy_contract',
                    data: JSON.stringify({
                      contract: generatedContract,
                      network: 'mumbai'
                    })
                  },
                  { method: 'post', action: '/api/blockchain' }
                );
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium"
            >
              Deploy to Polygon Mumbai
            </button>
            
            <button
              onClick={() => {
                // Copy contract to clipboard
                navigator.clipboard.writeText(generatedContract);
              }}
              className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white py-2 px-4 rounded-md font-medium"
            >
              Copy Contract
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
