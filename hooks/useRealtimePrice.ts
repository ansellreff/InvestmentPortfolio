import { useState, useEffect, useRef } from 'react';
import { marketDataClient, MarketDataUpdate } from '@/lib/websocket/marketDataClient';

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdate: number;
}

interface RealtimePriceOptions {
  enabled?: boolean;
  fallbackInterval?: number; // Fallback polling in ms
}

export function useRealtimePrice(
  symbols: string[],
  options: RealtimePriceOptions = {}
) {
  const { enabled = true, fallbackInterval = 5000 } = options;

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(new Map<string, (data: MarketDataUpdate) => void>());

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    // Initial fetch via API
    fetchInitialPrices();

    // Check if any symbols are crypto (support WebSocket)
    const cryptoSymbols = symbols.filter(s => {
      const upper = s.toUpperCase();
      return ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM']
        .some(c => upper.includes(c));
    });

    // Subscribe to WebSocket updates for crypto
    symbols.forEach(symbol => {
      const callback = (data: MarketDataUpdate) => {
        if (data.symbol === symbol || data.symbol === symbol.toUpperCase()) {
          setPrices(prev => ({
            ...prev,
            [symbol]: {
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              currency: 'USD',
              lastUpdate: data.timestamp
            }
          }));
        }
      };

      callbacksRef.current.set(symbol, callback);
      marketDataClient.subscribe(symbol, callback);
    });

    if (cryptoSymbols.length > 0) {
      setIsConnected(marketDataClient.isConnected);
    }

    // Cleanup
    return () => {
      symbols.forEach(symbol => {
        const callback = callbacksRef.current.get(symbol);
        if (callback) {
          marketDataClient.unsubscribe(symbol);
        }
      });
      callbacksRef.current.clear();
    };
  }, [symbols, enabled]);

  const fetchInitialPrices = async () => {
    await fetchPrices(symbols);
  };

  const fetchPrices = async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return;

    try {
      const response = await fetch('/api/prices/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolsToFetch })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPrices(prev => ({ ...prev, ...result.data }));
        }
      }
    } catch (error) {
      console.error('[useRealtimePrice] Failed to fetch prices:', error);
    }
  };

  // Fallback polling for non-WebSocket symbols
  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const pollInterval = setInterval(async () => {
      // Poll for all symbols to keep data fresh
      await fetchPrices(symbols);
    }, fallbackInterval);

    return () => clearInterval(pollInterval);
  }, [symbols, enabled, fallbackInterval]);

  return {
    prices,
    isConnected,
    getPrice: (symbol: string) => prices[symbol],
    refresh: () => fetchPrices(symbols)
  };
}

export type { PriceData };
