const { ethers } = require('ethers');
const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router02Artifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const WETH9Artifact = require('@uniswap/v2-periphery/build/WETH9.json');

const RPC_URL = 'https://rpc.testnet.arc.network';
const CHAIN_ID = 50178;

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY env var is not set');
  }

  // Use 'any' so ethers trusts whatever chain ID the RPC reports
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, 'any');

  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const deployer = wallet.address;

  console.log('\n========================================');
  console.log('  Sweetswap V2 — ARC Testnet Deploy');
  console.log('========================================');
  console.log(`Deployer : ${deployer}`);

  // Check balance
  const balance = await provider.getBalance(deployer);
  console.log(`Balance  : ${ethers.utils.formatEther(balance)} (native)`);
  if (balance.eq(0)) {
    throw new Error('Deployer wallet has 0 balance. Please fund it with ARC testnet tokens first.');
  }

  // ── 1. WETH9 (Wrapped native token = WARC) ─────────────────────────────
  console.log('\n[1/3] Deploying WETH9 (wrapped native / WARC)...');
  const wethFactory = new ethers.ContractFactory(
    WETH9Artifact.abi,
    WETH9Artifact.bytecode,
    wallet,
  );
  const weth = await wethFactory.deploy({ gasLimit: 1_000_000 });
  await weth.deployTransaction.wait(1);
  console.log(`  ✅ WETH9    : ${weth.address}`);
  console.log(`     TX       : ${weth.deployTransaction.hash}`);

  // ── 2. UniswapV2Factory ────────────────────────────────────────────────
  console.log('\n[2/3] Deploying UniswapV2Factory...');
  const factoryFactory = new ethers.ContractFactory(
    UniswapV2FactoryArtifact.abi,
    UniswapV2FactoryArtifact.bytecode,
    wallet,
  );
  const factory = await factoryFactory.deploy(deployer, { gasLimit: 5_000_000 });
  await factory.deployTransaction.wait(1);
  console.log(`  ✅ Factory  : ${factory.address}`);
  console.log(`     TX       : ${factory.deployTransaction.hash}`);

  // ── 3. UniswapV2Router02 ───────────────────────────────────────────────
  console.log('\n[3/3] Deploying UniswapV2Router02...');
  const routerFactory = new ethers.ContractFactory(
    UniswapV2Router02Artifact.abi,
    UniswapV2Router02Artifact.bytecode,
    wallet,
  );
  const router = await routerFactory.deploy(factory.address, weth.address, { gasLimit: 5_000_000 });
  await router.deployTransaction.wait(1);
  console.log(`  ✅ Router   : ${router.address}`);
  console.log(`     TX       : ${router.deployTransaction.hash}`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  DEPLOYMENT COMPLETE');
  console.log('========================================');
  console.log(`Network    : ARC Testnet (chain ${CHAIN_ID})`);
  console.log(`Deployer   : ${deployer}`);
  console.log(`WETH9      : ${weth.address}`);
  console.log(`Factory    : ${factory.address}`);
  console.log(`Router02   : ${router.address}`);
  console.log('========================================\n');

  // Write addresses to a JSON file for the frontend
  const addresses = {
    network: 'ARC Testnet',
    chainId: CHAIN_ID,
    deployer,
    weth: weth.address,
    factory: factory.address,
    router: router.address,
    deployedAt: new Date().toISOString(),
  };

  const fs = require('fs');
  fs.writeFileSync('addresses.json', JSON.stringify(addresses, null, 2));
  console.log('Addresses saved to contracts/addresses.json');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
