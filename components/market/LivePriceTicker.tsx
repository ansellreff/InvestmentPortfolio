'use client';

import { useEffect, useState } from 'react';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface LivePriceTickerProps {
  symbol: string;
  currency?: string;
  showChart?: boolean;
  className?: string;
}

export function LivePriceTicker({
  symbol,
  currency = 'USD',
  showChart = false,
  className = ''
}: LivePriceTickerProps) {
  const { prices, isConnected, getPrice } = useRealtimePrice([symbol], {
    enabled: true,
    fallbackInterval: 3000 // 3 second fallback
  });

  const priceData = getPrice(symbol);
  const [previousPrice, setPreviousPrice] = useState(priceData?.price || 0);
  const [flashDirection, setFlashDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (priceData?.price && priceData.price !== previousPrice) {
      setFlashDirection(priceData.price > previousPrice ? 'up' : 'down');
      setPreviousPrice(priceData.price);

      // Clear flash after 500ms
      const timeout = setTimeout(() => setFlashDirection(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [priceData?.price]);

  if (!priceData) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      </div>
    );
  }

  const isUp = priceData.changePercent >= 0;

  return (
    <div className={`
      transition-colors duration-200 rounded px-2 py-1 inline-flex items-center gap-2
      ${flashDirection === 'up' ? 'bg-green-500/20' : ''}
      ${flashDirection === 'down' ? 'bg-red-500/20' : ''}
      ${className}
    `}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tabular-nums">
          {priceData.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>

        <span className={`flex items-center gap-1 text-sm font-medium ${
          isUp ? 'text-green-500' : 'text-red-500'
        }`}>
          {isUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isUp ? '+' : ''}{priceData.changePercent.toFixed(2)}%
        </span>

        {isConnected && (
          <span className="flex items-center gap-1" title="Live connection">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
