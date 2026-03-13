'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { marketDataClient } from '@/lib/websocket/marketDataClient';

interface Trade {
  price: number;
  size: number;
  time: string;
  isBuy: boolean;
}

interface TimeAndSalesProps {
  symbol: string;
}

export function TimeAndSales({ symbol }: TimeAndSalesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if this is a crypto symbol
    const upperSymbol = symbol.toUpperCase();
    const isCrypto = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'BNB']
      .some(c => upperSymbol.includes(c));

    if (!isCrypto) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const handleTrade = (data: any) => {
      if (!mounted || data.symbol !== symbol) return;

      const newTrade: Trade = {
        price: data.price,
        size: Math.random() * 2, // Simulate size since ticker doesn't have trade size
        time: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        isBuy: data.changePercent >= 0
      };

      setTrades(prev => [newTrade, ...prev].slice(0, 50)); // Keep last 50
    };

    marketDataClient.subscribe(symbol, handleTrade);

    // Initial fetch of recent trades
    fetchRecentTrades();

    return () => {
      mounted = false;
      marketDataClient.unsubscribe(symbol);
    };
  }, [symbol]);

  const fetchRecentTrades = async () => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}USDT&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        const trades: Trade[] = data.map((t: any) => ({
          price: parseFloat(t.price),
          size: parseFloat(t.qty),
          time: new Date(t.time).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          isBuy: !t.isBuyerMaker
        }));

        setTrades(trades);
        setLoading(false);
      }
    } catch (error) {
      console.error('[TimeAndSales] Failed to fetch:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">Recent Trades</h3>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-5 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">Recent Trades</h3>
        <p className="text-sm text-slate-500 text-center py-4">
          No recent trades available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-4">Recent Trades</h3>

      <div className="text-xs grid grid-cols-3 gap-2 mb-2 text-slate-500">
        <div>Time</div>
        <div className="text-right">Price</div>
        <div className="text-right">Amount</div>
      </div>

      <div ref={containerRef} className="space-y-0.5 max-h-64 overflow-y-auto">
        {trades.map((trade, i) => (
          <div key={i} className="text-xs grid grid-cols-3 gap-2 py-0.5">
            <span className="text-slate-500">{trade.time}</span>
            <span className={`text-right font-medium ${
              trade.isBuy ? 'text-green-500' : 'text-red-500'
            }`}>
              {trade.price.toFixed(2)}
            </span>
            <span className="text-right text-slate-600">
              {trade.size.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
