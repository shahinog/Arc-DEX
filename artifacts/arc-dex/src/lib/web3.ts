import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const arcTestnet = defineChain({
  id: 50178,
  name: 'ARC Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ARC Explorer', url: 'https://explorer.arc.io' } },
  testnet: true,
});

const projectId = '915c6ece46481374b13a5835450c3751';

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'Sweetswap' }),
  ],
  transports: { [arcTestnet.id]: http() },
});
