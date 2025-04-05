import React, { useState } from 'react';
import { useContract, useContractRead } from '@thirdweb-dev/react';

interface Artifact {
  id: string;
  name: string;
  type: string;
  metadata: string;
  createdAt: number;
}

export default function ArtifactManager() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  
  const { contract } = useContract(import.meta.env.VITE_BLOCKABLE_CONTRACT);
  const { data: artifacts } = useContractRead(contract as any, "getAllArtifacts");

  const handleArtifactSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Artifact Manager</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Your Artifacts</h3>
            <div className="max-h-64 overflow-y-auto">
              {(artifacts as Artifact[])?.map((artifact) => (
                <div
                  key={artifact.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedArtifact?.id === artifact.id
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                  onClick={() => handleArtifactSelect(artifact)}
                >
                  <div className="font-medium">{artifact.name}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {artifact.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Artifact Details</h3>
            {selectedArtifact ? (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedArtifact.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedArtifact.type}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedArtifact.createdAt * 1000).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Metadata:</span>
                    <pre className="mt-2 p-2 bg-zinc-200 dark:bg-zinc-600 rounded overflow-x-auto">
                      {selectedArtifact.metadata}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Select an artifact to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
