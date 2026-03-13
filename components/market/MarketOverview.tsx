'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MarketStats {
  totalVolume: number;
  marketCap: number;
  gainers: number;
  losers: number;
  unchanged: number;
}

export function MarketOverview() {
  const [stats, setStats] = useState<MarketStats>({
    totalVolume: 0,
    marketCap: 0,
    gainers: 0,
    losers: 0,
    unchanged: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch market overview stats
    const fetchMarketStats = async () => {
      try {
        setLoading(true);
        // Simulate market stats for now
        // In production, fetch from API
        setStats({
          totalVolume: 1250000000000,
          marketCap: 750000000000000,
          gainers: 156,
          losers: 98,
          unchanged: 45,
        });
      } catch (error) {
        console.error('Error fetching market stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketStats();

    // Listen for global refresh event
    const handleRefreshEvent = () => {
      fetchMarketStats();
    };
    window.addEventListener('refresh-all-prices', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-all-prices', handleRefreshEvent);
    };
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const marketSentiment = stats.gainers > stats.losers ? 'bullish' : 'bearish';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Volume (24h)</p>
            <p className="text-lg font-bold">
              {loading ? '---' : formatNumber(stats.totalVolume)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Market Cap</p>
            <p className="text-lg font-bold">
              {loading ? '---' : formatNumber(stats.marketCap)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Gainers</p>
            <p className="text-lg font-bold text-green-600">
              {loading ? '---' : stats.gainers}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Losers</p>
            <p className="text-lg font-bold text-red-600">
              {loading ? '---' : stats.losers}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
