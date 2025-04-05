
import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ThirdwebProvider, metamaskWallet, coinbaseWallet, walletConnect } from "@thirdweb-dev/react";
import { Mumbai, Polygon, Sepolia } from '@thirdweb-dev/chains';

// Define supported chains
const supportedChains = [Mumbai, Polygon, Sepolia];

startTransition(() => {
  hydrateRoot(
    document.getElementById('root')!, 
    <ThirdwebProvider 
      supportedChains={supportedChains}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || "0f254f5b294d47a6e7ce6a4b593b8613"}
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
        walletConnect()
      ]}
    >
      <RemixBrowser />
    </ThirdwebProvider>
  );
});
