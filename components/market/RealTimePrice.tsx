'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface RealTimePriceProps {
  symbol: string;
  price: number;
  change: number;
  currency: string;
  onPriceUpdate?: (newPrice: number, newChange: number) => void;
  updateInterval?: number; // in milliseconds, default 5000 (5 seconds)
  showRefreshButton?: boolean;
  formatPrice: (price: number, currency: string) => string;
}

export function RealTimePrice({
  symbol,
  price,
  change,
  currency,
  onPriceUpdate,
  updateInterval = 5000,
  showRefreshButton = true,
  formatPrice,
}: RealTimePriceProps) {
  const [currentPrice, setCurrentPrice] = useState(price);
  const [currentChange, setCurrentChange] = useState(change);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  const previousPriceRef = useRef(price);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrice = async () => {
    try {
      setIsUpdating(true);

      const endpoint = symbol === 'GOLD' || symbol === 'SILVER' || symbol === 'PLATINUM' || symbol === 'PALLADIUM'
        ? `/api/${symbol.toLowerCase()}/price`
        : `/api/stocks/price?symbol=${encodeURIComponent(symbol)}`;

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success && result.data) {
        const newPrice = result.data.price;
        const newChange = result.data.change;

        // Determine price direction
        if (newPrice > previousPriceRef.current) {
          setPriceDirection('up');
        } else if (newPrice < previousPriceRef.current) {
          setPriceDirection('down');
        } else {
          setPriceDirection('neutral');
        }

        setCurrentPrice(newPrice);
        setCurrentChange(newChange);
        previousPriceRef.current = newPrice;

        if (onPriceUpdate) {
          onPriceUpdate(newPrice, newChange);
        }

        // Reset direction after animation
        setTimeout(() => setPriceDirection('neutral'), 1000);
      }
    } catch (error) {
      console.error(`[RealTimePrice] Error fetching price for ${symbol}:`, error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-refresh every updateInterval seconds
  useEffect(() => {
    fetchPrice(); // Initial fetch

    intervalRef.current = setInterval(() => {
      fetchPrice();
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, updateInterval]);

  // Manual refresh
  const handleRefresh = () => {
    fetchPrice();
  };

  const isPositive = currentChange >= 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`transition-all duration-300 ${
          priceDirection === 'up' ? 'animate-flash-green' : ''
        } ${priceDirection === 'down' ? 'animate-flash-red' : ''}`}
      >
        <span className="text-2xl font-bold">{formatPrice(currentPrice, currency)}</span>
      </div>

      <div
        className={`flex items-center gap-1 text-lg ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        <span>{isPositive ? '+' : ''}{formatPrice(currentChange, currency)}</span>
        <span className="text-sm">({isPositive ? '+' : ''}{((currentChange / (currentPrice - currentChange)) * 100).toFixed(2)}%)</span>
      </div>

      {showRefreshButton && (
        <button
          onClick={handleRefresh}
          disabled={isUpdating}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh price"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
