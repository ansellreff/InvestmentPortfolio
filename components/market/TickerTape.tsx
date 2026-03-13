'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  currency: string;
}

export function TickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  useEffect(() => {
    // Fetch ticker data
    const fetchTickers = async () => {
      try {
        // Fetch real-time data for popular stocks
        const symbols = [
          'GOLD',
          'BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'ASII.JK', 'UNVR.JK'
        ];

        const results: TickerItem[] = [];

        for (const symbol of symbols) {
          try {
            const endpoint = symbol === 'GOLD'
              ? '/api/gold/price'
              : `/api/stocks/price?symbol=${symbol}`;

            const response = await fetch(endpoint);
            const result = await response.json();

            if (result.success && result.data) {
              results.push({
                symbol: result.data.symbol || symbol,
                price: result.data.price || 0,
                change: result.data.changePercent || 0,
                currency: result.data.currency || (symbol.includes('.JK') ? 'IDR' : 'USD'),
              });
            }
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
          }
        }

        // If we got real data, use it; otherwise fallback to demo data
        if (results.length > 0) {
          // Duplicate items for seamless scrolling
          setTickers([...results, ...results]);
        } else {
          // Fallback to demo data
          const demoTickers: TickerItem[] = [
            { symbol: 'GOLD', price: 2845.50, change: 1.2, currency: 'USD' },
            { symbol: 'BBCA.JK', price: 10250, change: 0.5, currency: 'IDR' },
            { symbol: 'BBRI.JK', price: 5400, change: -0.3, currency: 'IDR' },
            { symbol: 'TLKM.JK', price: 3750, change: 1.1, currency: 'IDR' },
            { symbol: 'ASII.JK', price: 6200, change: 0.8, currency: 'IDR' },
            { symbol: 'UNVR.JK', price: 4850, change: -0.5, currency: 'IDR' },
          ];
          setTickers([...demoTickers, ...demoTickers]);
        }
      } catch (error) {
        console.error('Error fetching tickers:', error);
        // Fallback to demo data
        const demoTickers: TickerItem[] = [
          { symbol: 'GOLD', price: 2845.50, change: 1.2, currency: 'USD' },
          { symbol: 'BBCA.JK', price: 10250, change: 0.5, currency: 'IDR' },
          { symbol: 'BBRI.JK', price: 5400, change: -0.3, currency: 'IDR' },
          { symbol: 'TLKM.JK', price: 3750, change: 1.1, currency: 'IDR' },
          { symbol: 'ASII.JK', price: 6200, change: 0.8, currency: 'IDR' },
          { symbol: 'UNVR.JK', price: 4850, change: -0.5, currency: 'IDR' },
        ];
        setTickers([...demoTickers, ...demoTickers]);
      }
    };

    fetchTickers();

    // Listen for global refresh event
    const handleRefreshEvent = () => {
      fetchTickers();
    };
    window.addEventListener('refresh-all-prices', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-all-prices', handleRefreshEvent);
    };
  }, []);

  return (
    <div className="w-full bg-slate-900 text-white py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        <div className="inline-flex gap-8" ref={scrollRef}>
          {tickers.map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="inline-flex items-center gap-2 px-4">
              <span className="font-semibold text-sm">{ticker.symbol}</span>
              <span className="text-sm">{formatPriceInCurrency(ticker.price, ticker.currency)}</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  ticker.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {ticker.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {ticker.change >= 0 ? '+' : ''}
                {ticker.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
