'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { RefreshCw,
  TrendingUp,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface GainerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  currency: string;
}

export default function GainersPage() {
  const [gainers, setGainers] = useState<GainerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'stocks' | 'crypto'>('all');
  const { formatPrice: formatPriceInCurrency } = useCurrency();
const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function handleRefresh() {
      try {
        setLoading(true);

        // Fetch popular stocks and sort by gain
        const symbols = [
          'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA',
          'META', 'NVDA', 'AMD', 'INTC', 'CRM'
        ];

        const results: GainerData[] = [];

        for (const symbol of symbols) {
          try {
            const response = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(symbol)}`);
            const result = await response.json();

            if (result.success && result.data) {
              results.push({
                symbol: result.data.symbol,
                name: result.data.name,
                price: result.data.price,
                change: result.data.change,
                changePercent: result.data.changePercent,
                volume: result.data.volume || 0,
                marketCap: result.data.marketCap,
                currency: result.data.currency || 'USD',
              });
            }
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
          }
        }

        // Sort by change percent descending and filter positive changes
        const sorted = results
          .filter(item => item.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent);

        setGainers(sorted);
      } catch (error) {
        console.error('Error fetching gainers:', error);
      } finally {
        setLoading(false);
      }
    }

    handleRefresh();
  }, []);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toString();
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const symbols = [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA',
        'META', 'NVDA', 'AMD', 'INTC', 'CRM'
      ];

      const results: GainerData[] = [];

      for (const symbol of symbols) {
        try {
          const response = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(symbol)}`);
          const result = await response.json();

          if (result.success && result.data) {
            results.push({
              symbol: result.data.symbol,
              name: result.data.name,
              price: result.data.price,
              change: result.data.change,
              changePercent: result.data.changePercent,
              volume: result.data.volume || 0,
              marketCap: result.data.marketCap,
              currency: result.data.currency || 'USD',
            });
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
        }
      }

      const sorted = results
        .filter(item => item.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent);

      setGainers(sorted);
    } catch (error) {
      console.error('Error refreshing gainers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Navigation onRefresh={handleRefresh} refreshing={loading} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold">Top Gainers</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Stocks with the highest price increases today
          </p>
        </div>

        {/* Filter and Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            >
              <option value="all">All</option>
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-900 shadow-lg">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Gainers</p>
            <p className="text-3xl font-bold text-green-600">{gainers.length}</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-slate-900 shadow-lg">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Avg. Gain</p>
            <p className="text-3xl font-bold">
              {gainers.length > 0
                ? `+${(gainers.reduce((sum, g) => sum + g.changePercent, 0) / gainers.length).toFixed(2)}%`
                : '0.00%'}
            </p>
          </Card>
          <Card className="p-6 bg-white dark:bg-slate-900 shadow-lg">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Top Gainer</p>
            <p className="text-3xl font-bold">
              {gainers.length > 0 ? `+${gainers[0].changePercent.toFixed(2)}%` : '0.00%'}
            </p>
          </Card>
        </div>

        {/* Gainers Table */}
        <Card className="bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left p-4 font-semibold">Symbol</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-right p-4 font-semibold">Price</th>
                  <th className="text-right p-4 font-semibold">Change</th>
                  <th className="text-right p-4 font-semibold">Change %</th>
                  <th className="text-right p-4 font-semibold">Volume</th>
                  <th className="text-right p-4 font-semibold">Market Cap</th>
                  <th className="text-center p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {gainers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No gainers available at the moment</p>
                    </td>
                  </tr>
                ) : (
                  gainers.map((gainer, index) => (
                    <tr
                      key={gainer.symbol}
                      className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{gainer.symbol}</span>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs rounded-full font-medium">
                              #1
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {gainer.name}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatPriceInCurrency(gainer.price, gainer.currency)}
                      </td>
                      <td className="p-4 text-right text-green-600 font-semibold">
                        +{gainer.change.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full font-semibold">
                          +{gainer.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                        {formatVolume(gainer.volume)}
                      </td>
                      <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                        {formatMarketCap(gainer.marketCap)}
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/instrument/${gainer.symbol}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Data is updated in real-time. Top gainers are based on daily percentage change.
            This page shows stocks with positive price movement only.
          </p>
        </Card>
      </div>
    </div>
  );
}
