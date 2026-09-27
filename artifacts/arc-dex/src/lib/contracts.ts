/**
 * Sweetswap V2 — deployed contract addresses on ARC Testnet
 * Chain ID : 50178
 * Deployed : 2026-08-01
 */

export const CONTRACTS = {
  /** Deployer / fee-to-setter wallet */
  deployer:  '0x2f840F1e3AC2BC9170912dE992Cd90F181Dc3E32',

  /** WETH9 — wrapped native token (WARC) used by the router */
  weth:      '0x189ef9CD40ede0ee8C57d004685139c95B8075D4',

  /** UniswapV2Factory — creates and tracks all token pair pools */
  factory:   '0x98F06b1cAc76846944fB6cBCD1fb3a73A97b830A',

  /** UniswapV2Router02 — executes swaps and manages liquidity */
  router:    '0xFA643E697980844238c61E3c2B19fDCdb404d601',
} as const;

/** ABI fragments needed for on-chain calls */
export const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
] as const;

export const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
] as const;

export const WETH_ABI = [
  'function deposit() external payable',
  'function withdraw(uint wad) external',
  'function balanceOf(address) external view returns (uint)',
  'function approve(address spender, uint amount) external returns (bool)',
] as const;
