import React, { useState } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import Header from '../components/header/Header';
import { ClientOnly } from 'remix-utils/client-only';
import ContractGenerator from '../components/blockchain/ContractGenerator';
import CrossChainPanel from '../components/blockchain/CrossChainPanel';
import ArtifactManager from '../components/blockchain/ArtifactManager';
import MCPPanel from '../components/blockchain/MCPPanel'; // Assumed existing component

export const meta: MetaFunction = () => {
  return [
    { title: 'Blockable: Web3 Superhuman Engineer' },
    { name: 'description', content: 'AI-native, cross-chain, compliance-ready, developer-friendly Web3 engineering assistant' },
  ];
};

export default function Index() {
  const [showMCPPanel, setShowMCPPanel] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Blockable</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            Your AI-native, cross-chain, compliance-ready, developer-friendly Web3 engineering assistant
          </p>
        </div>

        {showMCPPanel ? (
          <div className="flex-1">
            <MCPPanel />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Smart Contract Generation</h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-4">
                  Generate smart contracts with AI, deployed across multiple chains via Polygon.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Cross-Chain Communication</h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-4">
                  Send messages and assets across chains using Hyperlane's Open Intents Framework.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect>
                    <line x1="12" y1="16" x2="12" y2="20"></line>
                    <line x1="8" y1="20" x2="16" y2="20"></line>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Compliance-Ready RWAs</h2>
                <p className="text-center text-zinc-600 dark:text-zinc-400 mb-4">
                  Create regulatory-compliant tokenized assets with HashKey integration.
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
              <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-3">Polygon</h2>
                <p className="text-sm mb-4">
                  Build with AggLayer, secured by Ethereum, with support for real-world assets and zkEVM technology.
                </p>
                <div className="text-blue-500 text-sm cursor-pointer" onClick={() => setShowMCPPanel(true)}>
                  Start building →
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-3">HashKey Chain</h2>
                <p className="text-sm mb-4">
                  Create compliant blockchain applications with built-in KYC/AML processes and regulatory frameworks.
                </p>
                <div className="text-blue-500 text-sm cursor-pointer" onClick={() => setShowMCPPanel(true)}>
                  Start building →
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-3">Hyperlane</h2>
                <p className="text-sm mb-4">
                  Connect any blockchain permissionlessly with interchain function calls and asset transfers.
                </p>
                <div className="text-blue-500 text-sm cursor-pointer" onClick={() => setShowMCPPanel(true)}>
                  Start building →
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMCPPanel(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-8"
            >
              Launch Blockchain Builder
            </button>
          </>
        )}
        <ClientOnly fallback={<div>Loading...</div>}>
          {() => (
            <div className="space-y-10">
              <ContractGenerator />
              <CrossChainPanel />
              <ArtifactManager />
            </div>
          )}
        </ClientOnly>
      </main>

      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Blockable</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cross-chain AI-powered Web3 development platform
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <h4 className="text-sm font-semibold mb-2">Partnerships</h4>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Polygon</li>
                  <li>Hyperlane</li>
                  <li>HashKey</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Resources</h4>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Documentation</li>
                  <li>GitHub</li>
                  <li>API Reference</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}