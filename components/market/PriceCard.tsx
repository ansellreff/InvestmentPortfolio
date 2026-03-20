'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MiniChart } from './MiniChart';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { useWatchlist } from '@/stores/useWatchlist';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';

interface PriceCardProps {
  symbol: string;
  name?: string;
  type?: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  onAddToWatchlist?: (symbol: string, name: string, type: string) => void;
  onAddToComparison?: (symbol: string, name: string, type: string, price: number, currency: string) => void;
  isSelectedForComparison?: boolean;
}

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  sparkline: number[];
}

export function PriceCard({ symbol, name, type = 'STOCK', onAddToWatchlist, onAddToComparison, isSelectedForComparison = false }: PriceCardProps) {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previousPrice, setPreviousPrice] = useState(0);
  const [flashDirection, setFlashDirection] = useState<'up' | 'down' | null>(null);
  const { isInWatchlist: checkIsInWatchlist } = useWatchlist();
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  // Real-time price updates via polling
  const { prices } = useRealtimePrice([symbol], {
    enabled: true,
    updateInterval: 10000 // 10 second updates
  });

  const realtimePriceData = prices[symbol];
  const isInWatchlist = mounted ? checkIsInWatchlist(symbol) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const endpoint = type === 'GOLD' || type === 'SILVER' || type === 'PLATINUM' || type === 'PALLADIUM'
          ? `/api/${type.toLowerCase()}/price`
          : type === 'CRYPTO'
          ? `/api/crypto/price?symbol=${symbol}`
          : `/api/stocks/price?symbol=${symbol}`;

        const response = await fetch(endpoint);
        const result = await response.json();

        if (result.success && result.data) {
          const price = result.data.price;

          // Only set data if we have a valid price
          if (price !== null && price !== undefined && isFinite(price) && price > 0) {
            // Generate sparkline data
            const sparkline = generateSparkline(price, result.data.individualPrices?.[0]?.price || price * 0.98);

            setData({
              symbol: result.data.symbol || symbol,
              name: result.data.name || name || symbol,
              price: price,
              change: result.data.change || 0,
              changePercent: result.data.changePercent || 0,
              currency: result.data.currency || 'USD',
              sparkline,
            });
            setPreviousPrice(price);
          } else {
            setData({
              symbol,
              name: name || symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              currency: 'USD',
              sparkline: [],
            });
          }
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Listen for global refresh event
    const handleRefreshEvent = () => {
      fetchPrice();
    };
    window.addEventListener('refresh-all-prices', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-all-prices', handleRefreshEvent);
    };
  }, [symbol, type, name]);

  // Update data when real-time prices change
  useEffect(() => {
    if (realtimePriceData && data) {
      const newPrice = realtimePriceData.price;
      const change = realtimePriceData.change;
      const changePercent = realtimePriceData.changePercent;

      // Flash animation on price change
      if (newPrice !== data.price && newPrice !== previousPrice) {
        const direction = newPrice > previousPrice ? 'up' : 'down';
        setFlashDirection(direction);
        setTimeout(() => setFlashDirection(null), 500);
        setPreviousPrice(newPrice);
      }

      setData(prev => prev ? {
        ...prev,
        price: newPrice,
        change: change || 0,
        changePercent: changePercent || 0,
      } : null);
    }
  }, [realtimePriceData]);

  // Generate mock sparkline data
  const generateSparkline = (currentPrice: number, basePrice: number) => {
    const points = 20;
    const dataArr = [];
    let price = basePrice;

    for (let i = 0; i < points; i++) {
      price = price + (Math.random() - 0.45) * (currentPrice * 0.02);
      dataArr.push(price);
    }
    dataArr.push(currentPrice);
    return dataArr;
  };

  const formatPrice = (price: number, currency: string) => {
    return formatPriceInCurrency(price, currency);
  };

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data && onAddToWatchlist && !isInWatchlist) {
      onAddToWatchlist(data.symbol, data.name, type);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data && onAddToComparison) {
      onAddToComparison(data.symbol, data.name, type, data.price, data.currency);
    }
  };

  const isUp = (data?.changePercent ?? 0) >= 0;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Link href={`/instrument/${data.symbol}`}>
      <Card className={`p-4 hover:shadow-lg transition-all cursor-pointer group ${
        flashDirection === 'up' ? 'bg-green-50/50 dark:bg-green-900/10' :
        flashDirection === 'down' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{data.symbol}</h3>
              <Badge variant="outline" className="text-xs">
                {type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 truncate">{data.name}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleAddToWatchlist}
              disabled={!mounted || isInWatchlist}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-slate-100 ${
                (mounted && isInWatchlist) || addedAnimation ? 'opacity-100 bg-green-100' : ''
              } disabled:opacity-100`}
              title={isInWatchlist ? "Already in watchlist" : "Add to watchlist"}
            >
              <Plus className="h-4 w-4 text-slate-600" />
            </button>
            {onAddToComparison && (
              <button
                onClick={handleAddToComparison}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-blue-100 ${
                  isSelectedForComparison ? 'opacity-100 bg-blue-100' : ''
                }`}
                title="Add to comparison"
              >
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            {data.price > 0 ? (
              <p className={`text-2xl font-bold tabular-nums transition-colors ${
                flashDirection === 'up' ? 'text-green-600' :
                flashDirection === 'down' ? 'text-red-600' : ''
              }`}>
                {formatPrice(data.price, data.currency)}
              </p>
            ) : (
              <p className="text-2xl font-bold text-slate-400">N/A</p>
            )}
            <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isUp ? '+' : ''}
              {data.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="h-16 w-32">
            <MiniChart data={data.sparkline} change={data.changePercent} isUp={isUp} />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>24h Change</span>
          <span className={isUp ? 'text-green-600' : 'text-red-600'}>
            {isUp ? '+' : ''}{formatPrice(data.change, data.currency)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
