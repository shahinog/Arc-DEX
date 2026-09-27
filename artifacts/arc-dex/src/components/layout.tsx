import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const TICKER_ITEMS = [
  { pair: 'USDC/WETH', price: '3,302.10', change: '+2.14%', up: true },
  { pair: 'WBTC/USDC', price: '67,420.50', change: '+1.82%', up: true },
  { pair: 'ARC/USDC', price: '0.8412', change: '+5.34%', up: true },
  { pair: 'ARB/USDC', price: '1.2340', change: '-0.73%', up: false },
  { pair: 'WETH/ARC', price: '3,926.15', change: '+3.01%', up: true },
  { pair: 'WBTC/WETH', price: '20.42', change: '-0.31%', up: false },
  { pair: 'ARC/WETH', price: '0.000254', change: '+6.12%', up: true },
  { pair: 'ARB/ARC', price: '1.4672', change: '+0.54%', up: true },
];

function PriceTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden bg-black/30 border-b border-white/5 py-1.5 relative">
      <div className="flex items-center ticker-scroll">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0 px-6 text-xs font-mono border-r border-white/5 last:border-0">
            <span className="text-muted-foreground">{item.pair}</span>
            <span className="text-foreground font-semibold">${item.price}</span>
            <span className={item.up ? 'text-emerald-400' : 'text-red-400'}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Swap' },
    { href: '/pools', label: 'Pools' },
    { href: '/portfolio', label: 'Portfolio' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sweet-pink via-sweet-purple to-primary flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-base tracking-tight bg-gradient-to-r from-sweet-pink via-sweet-purple to-primary bg-clip-text text-transparent">Sweetswap</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">powered by ARC</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium font-mono shadow-[0_0_10px_rgba(0,212,255,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              ARC Testnet
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        </div>
        <PriceTicker />
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col relative">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sweet-purple/5 via-background to-background z-[-1]" />
        {children}
      </main>
    </div>
  );
}
