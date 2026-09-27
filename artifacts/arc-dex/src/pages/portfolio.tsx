import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HOLDINGS = [
  { symbol: 'USDC', name: 'USD Coin', balance: '1,240.50', price: '$1.00', value: '$1,240.50' },
  { symbol: 'WETH', name: 'Wrapped Ether', balance: '0.45', price: '$3,302.10', value: '$1,485.95' },
  { symbol: 'ARC', name: 'ARC Token', balance: '500.00', price: '$0.84', value: '$420.00' },
];

const HISTORY = [
  { action: 'Swap', details: '100 USDC → 0.03 WETH', time: '2 hours ago', status: 'Success' },
  { action: 'Add Liquidity', details: '500 USDC + 595 ARC', time: '1 day ago', status: 'Success' },
  { action: 'Swap', details: '0.1 WETH → 330 USDC', time: '2 days ago', status: 'Success' },
];

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { toast } = useToast();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,212,255,0.1)] mb-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-dashed animate-[spin_4s_linear_infinite]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Connect your wallet</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Connect your wallet to view your token balances, liquidity positions, and transaction history.
        </p>
      </div>
    );
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 mt-4">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary border-2 border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.15)]">
            <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-mono font-bold tracking-tight">{address ? formatAddress(address) : ''}</h2>
              <button onClick={handleCopy} className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-md">
                <Copy className="w-4 h-4" />
              </button>
              <a 
                href={`https://explorer.arc.io/address/${address}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-md"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-sm text-primary flex items-center gap-1.5 font-medium bg-primary/10 w-fit px-2 py-0.5 rounded-full border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Connected to ARC Testnet
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Estimated Value</div>
          <div className="text-3xl font-bold font-mono tracking-tight">$3,146.45</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Holdings */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-lg font-bold">Assets</h3>
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-2">Token</div>
              <div className="text-right">Balance</div>
              <div className="text-right">Value</div>
            </div>
            <div className="divide-y divide-white/5">
              {/* Actual Native Balance via Wagmi */}
              <div className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center font-bold text-[10px] text-primary">
                    USDC
                  </div>
                  <div>
                    <div className="font-semibold">USDC</div>
                    <div className="text-xs text-muted-foreground">Native</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  {balanceData ? Number(balanceData.formatted).toFixed(4) : '0.00'}
                </div>
                <div className="text-right font-mono text-muted-foreground">--</div>
              </div>
              
              {/* Mocked tokens */}
              {HOLDINGS.filter(h => h.symbol !== 'USDC').map(token => (
                <div key={token.symbol} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center font-bold text-[10px] text-primary">
                      {token.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{token.balance}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{token.value}</div>
                    <div className="text-xs font-mono text-muted-foreground">{token.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">Recent History</h3>
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-white/5">
              {HISTORY.map((item, i) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-semibold">{item.action}</div>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded-sm border border-green-400/20">
                      <CheckCircle2 className="w-3 h-3" /> {item.status}
                    </div>
                  </div>
                  <div className="font-mono text-sm mb-2 group-hover:text-primary transition-colors">
                    {item.details}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {item.time}
                  </div>
                </div>
              ))}
              <a href={`https://explorer.arc.io/address/${address}`} target="_blank" rel="noreferrer" className="block p-3 text-center text-sm text-primary hover:bg-white/5 transition-colors border-t border-white/10">
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
