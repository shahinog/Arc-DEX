# Sweetswap powered by ARC

Sweetswap is a lightweight decentralized exchange interface built for the ARC testnet.

## Live app

- Published app: https://arc-dex--thinkairdrop.replit.app
- Network: ARC Testnet
- Chain ID: `50178`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: https://testnet.arcscan.app/

## Deployed contracts

| Contract | Address | Purpose |
| --- | --- | --- |
| Deployer / fee setter | `0x2f840F1e3AC2BC9170912dE992Cd90F181Dc3E32` | Deploys the protocol and controls the factory fee setting |
| WETH9 / WARC | `0x189ef9CD40ede0ee8C57d004685139c95B8075D4` | Wrapped native token used by the router |
| UniswapV2Factory | `0x98F06b1cAc76846944fB6cBCD1fb3a73A97b830A` | Creates and tracks liquidity pair contracts |
| UniswapV2Router02 | `0xFA643E697980844238c61E3c2B19fDCdb404d601` | Swap and liquidity-management entry point |

## Features

- MetaMask, WalletConnect, and Coinbase Wallet connection options
- Market swap interface with token selection and slippage settings
- Smart route display for multi-hop paths
- Sweet Score deal-quality indicator
- Limit-order interface
- Live price ticker and portfolio view
- ARC testnet contract address configuration

## Project structure

- `artifacts/arc-dex` — React + Vite frontend
- `contracts` — deployment script and deployed address record
- `artifacts/arc-dex/src/lib/contracts.ts` — frontend contract configuration and ABI fragments

## Run locally

```bash
pnpm install
pnpm --filter @workspace/arc-dex run dev
```

The frontend is configured for ARC Testnet and uses the published contract addresses above.