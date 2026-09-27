import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Settings2, ArrowDownUp, ChevronDown, CheckCircle2, Zap, Route, Star, Clock, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toHex } from 'viem';

const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', balance: '1,240.50', price: 1.00 },
  { symbol: 'WETH', name: 'Wrapped Ether', balance: '0.45', price: 3302.10 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.012', price: 67420.50 },
  { symbol: 'ARB', name: 'Arbitrum', balance: '1540.2', price: 1.234 },
  { symbol: 'ARC', name: 'ARC Token', balance: '500.0', price: 0.8412 },
];

// Exchange rates: fromSymbol -> toSymbol -> rate
const RATES: Record<string, Record<string, number>> = {
  USDC:  { WETH: 1/3302.10, WBTC: 1/67420.50, ARB: 1/1.234,   ARC: 1/0.8412  },
  WETH:  { USDC: 3302.10,   WBTC: 3302.10/67420.50, ARB: 3302.10/1.234, ARC: 3302.10/0.8412 },
  WBTC:  { USDC: 67420.50,  WETH: 67420.50/3302.10, ARB: 67420.50/1.234, ARC: 67420.50/0.8412 },
  ARB:   { USDC: 1.234,     WETH: 1.234/3302.10,   WBTC: 1.234/67420.50, ARC: 1.234/0.8412  },
  ARC:   { USDC: 0.8412,    WETH: 0.8412/3302.10,  WBTC: 0.8412/67420.50, ARB: 0.8412/1.234 },
};

// Smart route: sometimes goes through an intermediate hop
const SMART_ROUTES: Record<string, Record<string, string[]>> = {
  WBTC: { ARC: ['WBTC','USDC','ARC'], ARB: ['WBTC','USDC','ARB'] },
  ARC:  { WBTC: ['ARC','USDC','WBTC'] },
  ARB:  { WBTC: ['ARB','USDC','WBTC'] },
};

function getRoute(from: string, to: string): string[] {
  return SMART_ROUTES[from]?.[to] ?? [from, to];
}

function getSweetScore(priceImpact: number, slippage: string): number {
  const base = 100;
  const impactPenalty = Math.min(priceImpact * 8, 40);
  const slippagePenalty = parseFloat(slippage) * 5;
  return Math.max(Math.round(base - impactPenalty - slippagePenalty), 10);
}

function sweetScoreLabel(score: number) {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 75) return { label: 'Sweet Deal', color: 'text-primary' };
  if (score >= 55) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Risky', color: 'text-red-400' };
}

// Tiny sparkline SVG from fake price data
function Sparkline({ up }: { up: boolean }) {
  const points = up
    ? [0,30,22,28,18,25,12,20,8,15,4,10,0,5]
    : [0,5,8,4,12,8,18,12,22,16,26,20,30,25];
  const coords = points
    .map((y, i) => (i % 2 === 0 ? null : `${points[i - 1] * 3},${y * 1.2}`))
    .filter(Boolean)
    .join(' ');
  return (
    <svg width="60" height="36" viewBox="0 0 90 36" className="opacity-70">
      <polyline
        points={coords}
        fill="none"
        stroke={up ? '#34d399' : '#f87171'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Token = typeof TOKENS[0];
type SwapEntry = { id: number; text: string; time: string; hash?: string };
type LimitOrder = { id: number; from: Token; to: Token; fromAmt: string; limitPrice: string; created: string };

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { sendTransaction, isPending: isTxPending } = useSendTransaction();

  const [activeTab, setActiveTab] = useState<'market' | 'limit'>('market');
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState<'from' | 'to' | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<SwapEntry[]>([]);
  const [limitPrice, setLimitPrice] = useState('');
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const route = getRoute(fromToken.symbol, toToken.symbol);
  const priceImpact = fromAmount ? Math.min(parseFloat(fromAmount) / 10000, 5) : 0;
  const sweetScore = fromAmount ? getSweetScore(priceImpact, slippage) : 0;
  const { label: scoreLabel, color: scoreColor } = sweetScoreLabel(sweetScore);
  const priceImpactUp = (RATES[fromToken.symbol]?.[toToken.symbol] ?? 1) >= 1;

  useEffect(() => {
    if (fromAmount && !isNaN(Number(fromAmount)) && fromToken.symbol !== toToken.symbol) {
      const rate = RATES[fromToken.symbol]?.[toToken.symbol] ?? 1;
      setToAmount((Number(fromAmount) * rate).toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = useCallback(() => {
    if (!fromAmount || Number(fromAmount) <= 0 || !address) return;

    // Encode swap intent — triggers real MetaMask popup
    const calldata = toHex(
      `sweetswap|swap|${fromToken.symbol}|${toToken.symbol}|${fromAmount}|slippage:${slippage}%`
    );

    sendTransaction(
      {
        to: address,
        value: 0n,
        data: calldata,
      },
      {
        onSuccess: (hash) => {
          setSwapSuccess(true);
          setTimeout(() => setSwapSuccess(false), 2500);
          const entry: SwapEntry = {
            id: Date.now(),
            text: `${fromAmount} ${fromToken.symbol} → ${parseFloat(toAmount).toFixed(4)} ${toToken.symbol}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hash,
          };
          setRecentSwaps(prev => [entry, ...prev].slice(0, 5));
          setFromAmount('');
          setToAmount('');
          toast({
            title: 'Swap Submitted',
            description: `Tx: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
          });
        },
        onError: (err) => {
          toast({
            title: 'Swap Rejected',
            description: err.message?.slice(0, 80) ?? 'Transaction cancelled',
            variant: 'destructive',
          });
        },
      }
    );
  }, [address, fromAmount, toAmount, fromToken, toToken, slippage, sendTransaction, toast]);

  const handlePlaceLimitOrder = () => {
    if (!fromAmount || !limitPrice) return;
    const order: LimitOrder = {
      id: Date.now(),
      from: fromToken,
      to: toToken,
      fromAmt: fromAmount,
      limitPrice,
      created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLimitOrders(prev => [order, ...prev]);
    setFromAmount('');
    setLimitPrice('');
    toast({ title: 'Limit Order Placed', description: `Buy ${toToken.symbol} at $${limitPrice}` });
  };

  const TokenIcon = ({ symbol }: { symbol: string }) => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sweet-purple/30 to-primary/20 border border-white/10 flex items-center justify-center font-bold text-xs text-primary shadow-inner">
      {symbol.substring(0, 2)}
    </div>
  );

  const marketRate = fromToken.symbol !== toToken.symbol
    ? (RATES[fromToken.symbol]?.[toToken.symbol] ?? 1)
    : 1;

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-5 mt-4 md:mt-8">

      {/* Swap/Limit tabs */}
      <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl border border-white/5 w-fit mx-auto">
        {(['market', 'limit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-gradient-to-r from-sweet-pink/80 to-sweet-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'market' ? 'Market' : 'Limit Order'}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div className={`glass-card p-4 transition-all ${swapSuccess ? 'ring-2 ring-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.2)]' : ''}`}>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">{activeTab === 'market' ? 'Swap' : 'Limit Order'}</h2>
            {fromAmount && toAmount && activeTab === 'market' && (
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 border border-white/5 ${scoreColor}`}>
                <Star className="w-3 h-3" />
                {sweetScore}/100 · {scoreLabel}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {showSettings && (
          <div className="mb-4 p-4 rounded-xl bg-black/20 border border-white/5 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Slippage Tolerance</label>
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0'].map(val => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-mono transition-colors ${
                    slippage === val
                      ? 'bg-sweet-purple/20 text-sweet-purple border border-sweet-purple/50'
                      : 'bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={slippage}
                  onChange={e => setSlippage(e.target.value)}
                  className="w-full bg-white/5 border border-transparent focus:border-sweet-purple/50 rounded-md py-1.5 px-3 text-sm font-mono outline-none text-right"
                />
                <span className="absolute right-3 top-1.5 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            {activeTab === 'market' && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Transaction deadline: 20 min</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 relative">
          {/* From */}
          <div className="glass-input p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>You pay</span>
              <span className="font-mono text-xs">Balance: {fromToken.balance}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                className="bg-transparent border-none outline-none text-3xl font-mono w-full placeholder:text-muted-foreground/30 focus:ring-0 p-0"
                data-testid="input-from-amount"
              />
              <button
                onClick={() => setShowTokenSelect('from')}
                className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-full border border-white/5 transition-colors shrink-0"
                data-testid="button-from-token"
              >
                <TokenIcon symbol={fromToken.symbol} />
                <span className="font-semibold">{fromToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {fromAmount && (
              <div className="text-xs text-muted-foreground font-mono">
                ≈ ${(Number(fromAmount) * fromToken.price).toFixed(2)}
              </div>
            )}
          </div>

          {/* Flip */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button
              onClick={() => {
                setFromToken(toToken);
                setToToken(fromToken);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }}
              className="p-2 bg-card border border-white/10 rounded-xl text-muted-foreground hover:text-primary hover:border-sweet-purple/30 transition-all hover:rotate-180 duration-300"
              data-testid="button-flip-tokens"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* To */}
          <div className="glass-input p-4 flex flex-col gap-2 mt-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>You receive</span>
              <span className="font-mono text-xs">Balance: {toToken.balance}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                readOnly
                placeholder="0.0"
                value={toAmount}
                className="bg-transparent border-none outline-none text-3xl font-mono w-full placeholder:text-muted-foreground/30 focus:ring-0 p-0 text-foreground"
              />
              <button
                onClick={() => setShowTokenSelect('to')}
                className="flex items-center gap-2 bg-sweet-purple/10 hover:bg-sweet-purple/20 text-sweet-purple px-3 py-1.5 rounded-full border border-sweet-purple/20 transition-colors shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                data-testid="button-to-token"
              >
                <TokenIcon symbol={toToken.symbol} />
                <span className="font-semibold">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {toAmount && (
              <div className="text-xs text-muted-foreground font-mono">
                ≈ ${(Number(toAmount) * toToken.price).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Limit price input (limit mode only) */}
        {activeTab === 'limit' && (
          <div className="mt-3 glass-input p-4 flex flex-col gap-2 animate-in fade-in">
            <div className="text-sm text-muted-foreground">Limit price (USD per {toToken.symbol})</div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                placeholder={toToken.price.toFixed(4)}
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                className="bg-transparent border-none outline-none text-2xl font-mono w-full placeholder:text-muted-foreground/30 p-0"
              />
              <button
                onClick={() => setLimitPrice(toToken.price.toFixed(4))}
                className="text-xs text-primary font-semibold px-2 py-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                Market
              </button>
            </div>
          </div>
        )}

        {/* Info panel */}
        {fromAmount && toAmount && activeTab === 'market' && (
          <div className="mt-4 space-y-2 animate-in fade-in">
            {/* Smart route */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
              <Route className="w-3.5 h-3.5 text-sweet-purple shrink-0" />
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground overflow-x-auto">
                {route.map((hop, i) => (
                  <React.Fragment key={hop}>
                    <span className={i === 0 || i === route.length - 1 ? 'text-foreground' : 'text-sweet-purple font-semibold'}>
                      {hop}
                    </span>
                    {i < route.length - 1 && <span className="text-white/20">→</span>}
                  </React.Fragment>
                ))}
                {route.length > 2 && (
                  <span className="ml-1 text-[10px] text-sweet-purple bg-sweet-purple/10 px-1.5 py-0.5 rounded-full border border-sweet-purple/20">
                    Smart Route
                  </span>
                )}
              </div>
            </div>

            {/* Rate + price impact */}
            <div className="flex justify-between px-2 text-xs font-mono text-muted-foreground">
              <span>Rate</span>
              <span className="flex items-center gap-1">
                {priceImpactUp ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                1 {fromToken.symbol} = {marketRate < 0.01 ? marketRate.toExponential(3) : marketRate.toFixed(4)} {toToken.symbol}
              </span>
            </div>

            <div className="flex justify-between px-2 text-xs font-mono text-muted-foreground">
              <span>Price impact</span>
              <span className={priceImpact > 2 ? 'text-red-400' : priceImpact > 0.5 ? 'text-yellow-400' : 'text-emerald-400'}>
                {priceImpact < 0.01 ? '<0.01' : priceImpact.toFixed(2)}%
              </span>
            </div>

            {/* Sweet score bar */}
            <div className="px-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-muted-foreground"><Zap className="w-3 h-3" /> Sweet Score</span>
                <span className={`font-semibold ${scoreColor}`}>{sweetScore}/100 · {scoreLabel}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sweetScore}%`,
                    background: sweetScore >= 90 ? '#34d399' : sweetScore >= 75 ? '#00d4ff' : sweetScore >= 55 ? '#facc15' : '#f87171',
                    boxShadow: `0 0 6px ${sweetScore >= 75 ? '#00d4ff88' : '#facc1588'}`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-4">
          {!isConnected ? (
            <div className="w-full h-14 flex items-center justify-center bg-gradient-to-r from-sweet-pink to-sweet-purple text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-shadow">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="w-full h-full" data-testid="button-connect-wallet">
                    Connect Wallet to Swap
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          ) : activeTab === 'market' ? (
            <button
              onClick={handleSwap}
              disabled={!fromAmount || Number(fromAmount) <= 0 || isTxPending}
              className={`w-full h-14 flex items-center justify-center font-semibold rounded-xl transition-all ${
                !fromAmount || Number(fromAmount) <= 0
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : isTxPending
                  ? 'bg-sweet-purple/60 text-white cursor-wait'
                  : 'bg-gradient-to-r from-sweet-pink to-sweet-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] hover:scale-[1.01] active:scale-100'
              }`}
              data-testid="button-confirm-swap"
            >
              {isTxPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirm in MetaMask...
                </span>
              ) : !fromAmount || Number(fromAmount) <= 0 ? (
                'Enter an amount'
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Confirm Swap
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handlePlaceLimitOrder}
              disabled={!fromAmount || !limitPrice}
              className={`w-full h-14 flex items-center justify-center font-semibold rounded-xl transition-all ${
                !fromAmount || !limitPrice
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-gradient-to-r from-sweet-pink to-sweet-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)]'
              }`}
              data-testid="button-place-limit"
            >
              Place Limit Order
            </button>
          )}
        </div>
      </div>

      {/* Sparkline / pair chart hint */}
      {fromToken.symbol !== toToken.symbol && (
        <div className="glass-card p-4 flex items-center justify-between animate-in fade-in">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">7d price trend</div>
            <div className="font-semibold text-sm">{fromToken.symbol}/{toToken.symbol}</div>
            <div className={`text-xs font-mono ${priceImpactUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceImpactUp ? '+' : ''}{((Math.random() * 6 - 1)).toFixed(2)}% this week
            </div>
          </div>
          <Sparkline up={priceImpactUp} />
        </div>
      )}

      {/* Pending limit orders */}
      {activeTab === 'limit' && limitOrders.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Open Limit Orders</h3>
          <div className="glass-card p-1 divide-y divide-white/5">
            {limitOrders.map(order => (
              <div key={order.id} className="p-3 flex items-center justify-between text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{order.fromAmt} {order.from.symbol} → {order.to.symbol}</span>
                  <span className="text-xs font-mono text-muted-foreground">@ ${order.limitPrice} · {order.created}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">OPEN</span>
                  <button
                    onClick={() => setLimitOrders(prev => prev.filter(o => o.id !== order.id))}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent swaps */}
      {isConnected && recentSwaps.length > 0 && activeTab === 'market' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Recent Swaps</h3>
          <div className="glass-card p-1 divide-y divide-white/5">
            {recentSwaps.map(swap => (
              <div key={swap.id} className="p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-foreground/90 font-mono text-xs">{swap.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  {swap.hash && (
                    <a
                      href={`https://explorer.arc.io/tx/${swap.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      {swap.hash.slice(0, 6)}...
                    </a>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">{swap.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token select modal */}
      {showTokenSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border-white/10">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold">Select Token</h3>
              <button onClick={() => setShowTokenSelect(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-y-auto">
              {TOKENS.filter(t => showTokenSelect === 'from' ? t.symbol !== fromToken.symbol : t.symbol !== toToken.symbol).map(token => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    if (showTokenSelect === 'from') setFromToken(token);
                    else setToToken(token);
                    setShowTokenSelect(null);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sweet-purple/30 to-primary/20 border border-white/10 flex items-center justify-center font-bold text-xs text-primary">
                      {token.symbol.substring(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold group-hover:text-primary transition-colors">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{token.balance}</div>
                    <div className="text-xs text-muted-foreground font-mono">${token.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
