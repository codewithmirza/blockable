import { memo } from 'react';
import { PanelHeader } from '~/components/ui/PanelHeader';
import BlockchainPreview from '../blockchain/BlockchainPreview';

export const BlockchainPreviewPanel = memo(() => {
  return (
    <div className="w-full h-full flex flex-col">
      <PanelHeader title="Blockchain Preview" />
      <div className="flex-1 border-t border-bolt-elements-borderColor overflow-auto p-4">
        <BlockchainPreview />
      </div>
    </div>
  );
});