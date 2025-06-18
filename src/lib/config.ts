import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

// Singleton pattern to prevent multiple initializations
let wagmiConfig: ReturnType<typeof getDefaultConfig> | null = null;

export const config = (() => {
  if (!wagmiConfig) {
    wagmiConfig = getDefaultConfig({
      appName: 'Nemo - NFT Photo Albums',
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
      chains: [base, baseSepolia],
      ssr: true,
    });
  }
  return wagmiConfig;
})();

export const BASE_SCAN_URL = 'https://basescan.org';
export const BASE_SEPOLIA_SCAN_URL = 'https://sepolia.basescan.org';

export const getExplorerUrl = (chainId: number) => {
  return chainId === base.id ? BASE_SCAN_URL : BASE_SEPOLIA_SCAN_URL;
};
