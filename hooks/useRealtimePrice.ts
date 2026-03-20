import { useState, useEffect, useRef } from 'react';

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdate: number;
}

interface RealtimePriceOptions {
  enabled?: boolean;
  updateInterval?: number; // Milliseconds between updates (default: 10000 = 10s)
}

interface PriceResult {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

/**
 * Optimized price updates via polling (no WebSocket to avoid errors)
 * Default 10-second interval to minimize API usage
 */
export function useRealtimePrice(
  symbols: string[],
  options: RealtimePriceOptions = {}
) {
  const { enabled = true, updateInterval = 10000 } = options;

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const previousPricesRef = useRef<Record<string, number>>({});

  // Fetch prices via batch API (optimized single call)
  const fetchPrices = async () => {
    if (!enabled || symbols.length === 0 || !mountedRef.current) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/prices/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Type assertion for the price data
          const priceData: Record<string, PriceResult> = result.data;
          setPrices(prev => {
            const newPrices = { ...prev };

            Object.entries(priceData).forEach(([symbol, data]: [string, PriceResult]) => {
              const prevPrice = previousPricesRef.current[symbol];
              const currentPrice = data.price;

              // Only add if price actually changed (avoid unnecessary re-renders)
              if (!prevPrice || Math.abs(currentPrice - prevPrice) > 0.001) {
                newPrices[symbol] = {
                  price: data.price,
                  change: data.change || 0,
                  changePercent: data.changePercent || 0,
                  currency: data.currency || 'USD',
                  lastUpdate: Date.now()
                };
              }
            });

            return newPrices;
          });
        }
      }
    } catch (error) {
      console.error('[useRealtimePrice] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      fetchPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, symbols.join(',')]);

  // Polling interval (10 seconds default)
  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const interval = setInterval(fetchPrices, updateInterval);

    return () => clearInterval(interval);
  }, [enabled, symbols, updateInterval]);

  // Update previous prices reference when prices change
  useEffect(() => {
    previousPricesRef.current = Object.fromEntries(
      Object.entries(prices).map(([sym, data]) => [sym, data.price])
    );
  }, [prices]);

  return {
    prices,
    isLoading,
    getPrice: (symbol: string) => prices[symbol],
    refresh: fetchPrices
  };
}

export type { PriceData };
