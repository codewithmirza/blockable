import React, { useState } from 'react';
import { useContract, useContractWrite } from '@thirdweb-dev/react';
import { CodeBlock } from '../chat/CodeBlock';

interface ContractResponse {
  success: boolean;
  contract: string;
  audit: string;
  error?: string;
}

export default function ContractGenerator() {
  const [contractCode, setContractCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');
  const [auditResult, setAuditResult] = useState('');

  const { contract } = useContract(import.meta.env.VITE_BLOCKABLE_CONTRACT);
  const { mutateAsync: createArtifact } = useContractWrite(contract as any, "createArtifact");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/blockchain.mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_contract',
          data: {
            requirements: contractCode,
            features: ['ERC20', 'AccessControl', 'PolygonCompatible']
          }
        })
      });

      const result = await response.json() as ContractResponse;
      if (result.success) {
        setGeneratedContract(result.contract);
        setAuditResult(result.audit);
      }
    } catch (error) {
      console.error('Error generating contract:', error);
    }
    setIsGenerating(false);
  };

  const handleDeploy = async () => {
    try {
      await createArtifact({
        args: [
          generatedContract,
          'ipfs://' + Math.random().toString(36).substring(7), // Mock IPFS hash
          '0x' + Math.random().toString(36).substring(7) // Mock metadata hash
        ]
      } as any);
    } catch (error) {
      console.error('Error deploying contract:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Contract Generator</h2>
      <div className="space-y-4">
        <textarea
          className="w-full h-32 p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg"
          value={contractCode}
          onChange={(e) => setContractCode(e.target.value)}
          placeholder="Enter contract requirements or let AI generate it..."
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Contract'}
        </button>

        {generatedContract && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Generated Contract</h3>
            <CodeBlock language="solidity" code={generatedContract} />
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Security Audit</h3>
            <div className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
              <pre className="whitespace-pre-wrap">{auditResult}</pre>
            </div>

            <button
              onClick={handleDeploy}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Deploy Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
