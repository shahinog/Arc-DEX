import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Plus, Minus, ArrowRight, Settings2 } from 'lucide-react';

const POOLS = [
  { pair: 'USDC / WETH', tvl: '$12.4M', vol24h: '$4.2M', apy: '18.4%', userLiquidity: '$0.00' },
  { pair: 'WBTC / USDC', tvl: '$8.7M', vol24h: '$2.1M', apy: '12.1%', userLiquidity: '$0.00' },
  { pair: 'ARC / USDC', tvl: '$4.2M', vol24h: '$1.8M', apy: '45.2%', userLiquidity: '$1,250.00' },
  { pair: 'ARB / WETH', tvl: '$2.1M', vol24h: '$800K', apy: '8.4%', userLiquidity: '$0.00' },
];

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const [expandedPool, setExpandedPool] = useState<string | null>(null);

  const StatBox = ({ label, value }: { label: string, value: string }) => (
    <div className="glass-card p-6 flex flex-col justify-center">
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">{value}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Total Value Locked" value="$27.4M" />
        <StatBox label="24h Volume" value="$8.9M" />
        <StatBox label="Active Pools" value="12" />
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-xl font-bold">Liquidity Pools</h2>
        <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Settings2 className="w-4 h-4" />
          <span>Create Pool</span>
        </button>
      </div>

      {/* Pools List */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Pool Pair</div>
          <div className="col-span-2 text-right">TVL</div>
          <div className="col-span-2 text-right">24h Vol</div>
          <div className="col-span-2 text-right">APY</div>
          <div className="col-span-2 text-right">Your Liquidity</div>
        </div>

        <div className="divide-y divide-white/5">
          {POOLS.map(pool => (
            <React.Fragment key={pool.pair}>
              <div 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setExpandedPool(expandedPool === pool.pair ? null : pool.pair)}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary z-10">
                      {pool.pair.split(' / ')[0]}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0">
                      {pool.pair.split(' / ')[1]}
                    </div>
                  </div>
                  <span className="font-semibold text-foreground/90">{pool.pair}</span>
                </div>
                <div className="col-span-2 text-right font-mono text-sm">{pool.tvl}</div>
                <div className="col-span-2 text-right font-mono text-sm">{pool.vol24h}</div>
                <div className="col-span-2 text-right font-mono text-sm text-green-400">{pool.apy}</div>
                <div className="col-span-2 text-right font-mono text-sm text-primary">{pool.userLiquidity}</div>
              </div>

              {/* Expanded Panel */}
              {expandedPool === pool.pair && (
                <div className="bg-black/20 p-6 border-y border-white/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Liquidity */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" /> Add Liquidity
                      </h4>
                      <div className="flex gap-2">
                        <div className="flex-1 glass-input p-3 flex justify-between items-center">
                          <input type="text" placeholder="0.0" className="bg-transparent outline-none font-mono w-full" />
                          <span className="text-sm font-semibold">{pool.pair.split(' / ')[0]}</span>
                        </div>
                        <div className="flex items-center justify-center text-muted-foreground">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                        <div className="flex-1 glass-input p-3 flex justify-between items-center">
                          <input type="text" placeholder="0.0" className="bg-transparent outline-none font-mono w-full" />
                          <span className="text-sm font-semibold">{pool.pair.split(' / ')[1]}</span>
                        </div>
                      </div>
                      <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                        Supply
                      </button>
                    </div>

                    {/* Remove Liquidity */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Minus className="w-4 h-4 text-destructive" /> Remove Liquidity
                      </h4>
                      {pool.userLiquidity === '$0.00' ? (
                        <div className="h-12 flex items-center justify-center text-sm text-muted-foreground bg-white/5 rounded-lg border border-white/5">
                          No liquidity in this pool
                        </div>
                      ) : (
                        <>
                          <div className="glass-input p-4 flex items-center justify-between">
                            <input type="range" className="w-full accent-primary" defaultValue="0" />
                            <span className="ml-4 font-mono text-sm w-12 text-right">0%</span>
                          </div>
                          <button className="w-full py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-semibold hover:bg-destructive/20 transition-colors text-sm">
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
