import { useState } from 'react';
import { MCPContext, MCPMessage, mcpAgent } from '~/lib/agents/mcp';
import PanelHeader from '../ui/PanelHeader';

interface ChainOption {
  id: string;
  name: string;
  description: string;
  features: string[];
  logoUrl?: string;
  testnetUrl?: string;
}

const CHAIN_OPTIONS: ChainOption[] = [
  {
    id: 'polygon',
    name: 'Polygon',
    description: 'Aggregate blockchains via AggLayer, secured by Ethereum',
    features: [
      'Real World Assets',
      'Cross-chain interoperability',
      'Polygon zkEVM',
      'Polygon CDK'
    ],
    testnetUrl: 'https://rpc.ankr.com/polygon_mumbai'
  },
  {
    id: 'hashkey',
    name: 'HashKey Chain',
    description: 'Comprehensive and secure blockchain platform with licensed compliance',
    features: [
      'Compliance Innovation',
      'KYC/AML Integration',
      'RWA Tokenization',
      'Regulatory Framework'
    ],
    testnetUrl: 'https://kyc-testnet.hunyuankyc.com/'
  },
  {
    id: 'hyperlane',
    name: 'Hyperlane',
    description: 'First interoperability layer to permissionlessly connect any blockchain',
    features: [
      'Cross-chain messaging',
      'Interchain function calls',
      'Asset transfers',
      'Modular security stack'
    ]
  }
];

export default function MCPPanel() {
  const [selectedChain, setSelectedChain] = useState<string>('polygon');
  const [userIntent, setUserIntent] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleProcessIntent = async () => {
    if (!userIntent.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/blockchain/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chain: selectedChain,
          intent: userIntent,
        }),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error processing intent:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-default">
      <PanelHeader title="Model Context Protocol" />

      <div className="p-4 flex-1 overflow-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Select Blockchain</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose a blockchain network based on your application needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CHAIN_OPTIONS.map((option) => (
              <div 
                key={option.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedChain === option.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
                onClick={() => setSelectedChain(option.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{option.name}</h3>
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                    {selectedChain === option.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm mb-2">{option.description}</p>
                <div className="mt-2">
                  <ul className="text-xs">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="mb-1 flex items-center">
                        <span className="mr-1 text-green-500">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                {option.testnetUrl && (
                  <div className="mt-3 text-xs text-blue-500">
                    <a href={option.testnetUrl} target="_blank" rel="noopener noreferrer">
                      Access Testnet Tools →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Express Your Intent</h2>
          <p className="text-sm text-gray-500 mb-4">
            Describe what you want to build, and our AI will translate it to blockchain actions
          </p>

          <textarea
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 min-h-[120px] bg-white dark:bg-gray-800"
            placeholder={`Example: "I want to create a compliant NFT marketplace for real estate tokenization"`}
            value={userIntent}
            onChange={(e) => setUserIntent(e.target.value)}
          />

          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleProcessIntent}
            disabled={processing || !userIntent.trim()}
          >
            {processing ? (
              <span className="flex items-center">
                <span className="i-svg-spinners:90-ring-with-bg text-white mr-2"></span>
                Processing...
              </span>
            ) : 'Process Intent'}
          </button>
        </div>

        {result && (
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-bold mb-2">Intent Analysis</h3>
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-bold">Action:</span> {result.action}
              </div>
              <div>
                <span className="font-bold">Parameters:</span>
                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                  {JSON.stringify(result.params, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                onClick={() => {
                  // This would be connected to your implementation logic
                  alert('Implementation functionality coming soon!');
                }}
              >
                Implement This Solution
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}