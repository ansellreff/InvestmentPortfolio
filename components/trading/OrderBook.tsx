'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { marketDataClient } from '@/lib/websocket/marketDataClient';

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [spread, setSpread] = useState({ value: 0, percent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this is a crypto symbol (only crypto has order book via Binance)
    const upperSymbol = symbol.toUpperCase();
    const isCrypto = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'BNB']
      .some(c => upperSymbol.includes(c));

    if (!isCrypto) {
      setLoading(false);
      return;
    }

    // Fetch initial order book
    fetchOrderBook();

    // Subscribe to updates
    const handleUpdate = () => {
      fetchOrderBook();
    };

    marketDataClient.subscribe(symbol, handleUpdate);

    const interval = setInterval(fetchOrderBook, 3000); // Refresh every 3s

    return () => {
      clearInterval(interval);
      marketDataClient.unsubscribe(symbol);
    };
  }, [symbol]);

  const fetchOrderBook = async () => {
    try {
      // For crypto, use Binance order book API
      const response = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}USDT&limit=10`
      );

      if (response.ok) {
        const data = await response.json();

        const newBids = data.bids.map((b: string[]) => ({
          price: parseFloat(b[0]),
          size: parseFloat(b[1]),
          total: parseFloat(b[0]) * parseFloat(b[1])
        }));

        const newAsks = data.asks.map((a: string[]) => ({
          price: parseFloat(a[0]),
          size: parseFloat(a[1]),
          total: parseFloat(a[0]) * parseFloat(a[1])
        }));

        setBids(newBids.slice(0, 8));
        setAsks(newAsks.slice(0, 8));

        if (newBids[0] && newAsks[0]) {
          const spreadValue = newAsks[0].price - newBids[0].price;
          const spreadPercent = (spreadValue / newBids[0].price) * 100;
          setSpread({ value: spreadValue, percent: spreadPercent });
        }

        setLoading(false);
      }
    } catch (error) {
      console.error('[OrderBook] Failed to fetch:', error);
      setLoading(false);
    }
  };

  const maxTotal = Math.max(
    ...bids.map(b => b.total),
    ...asks.map(a => a.total)
  );

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Order Book</h3>
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (bids.length === 0 && asks.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Order Book</h3>
        </div>
        <p className="text-sm text-slate-500 text-center py-4">
          Order book not available for this asset
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Order Book</h3>
        <div className="text-xs text-slate-500">
          Spread: <span className="font-medium">{spread.percent.toFixed(3)}%</span>
        </div>
      </div>

      <div className="text-xs grid grid-cols-3 gap-2 mb-2 text-slate-500">
        <div>Price (USDT)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (sell orders) - reversed to show lowest at top */}
      <div className="space-y-0.5 mb-2">
        {[...asks].reverse().map((ask, i) => (
          <div key={i} className="relative text-xs grid grid-cols-3 gap-2 py-0.5">
            <div
              className="absolute right-0 top-0 bottom-0 bg-red-500/10"
              style={{ width: `${(ask.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-red-500">{ask.price.toFixed(2)}</span>
            <span className="relative text-right text-slate-600">{ask.size.toFixed(4)}</span>
            <span className="relative text-right text-slate-500">{ask.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="py-1 text-center text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded my-2">
        {spread.value.toFixed(2)} USDT
      </div>

      {/* Bids (buy orders) */}
      <div className="space-y-0.5">
        {bids.map((bid, i) => (
          <div key={i} className="relative text-xs grid grid-cols-3 gap-2 py-0.5">
            <div
              className="absolute right-0 top-0 bottom-0 bg-green-500/10"
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-green-500">{bid.price.toFixed(2)}</span>
            <span className="relative text-right text-slate-600">{bid.size.toFixed(4)}</span>
            <span className="relative text-right text-slate-500">{bid.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
