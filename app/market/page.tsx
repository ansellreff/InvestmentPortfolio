'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceCard } from '@/components/market/PriceCard';
import { TopMovers } from '@/components/market/TopMovers';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { Navigation } from '@/components/Navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Globe,
  Clock
} from 'lucide-react';

interface MarketStat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  currency: string;
}

export default function MarketPage() {
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  useEffect(() => {
    async function fetchMarketOverview() {
      try {
        setLoading(true);

        // Fetch major indices
        const indicesToFetch = [
          { symbol: '^GSPC', name: 'S&P 500' },
          { symbol: '^DJI', name: 'Dow Jones' },
          { symbol: '^IXIC', name: 'NASDAQ' },
        ];

        const fetchedIndices: MarketIndex[] = [];

        for (const index of indicesToFetch) {
          try {
            const response = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(index.symbol)}`);
            const result = await response.json();

            if (result.success) {
              fetchedIndices.push({
                symbol: index.symbol,
                name: index.name,
                value: result.data.price,
                change: result.data.change,
                changePercent: result.data.changePercent,
                currency: result.data.currency || 'USD',
              });
            }
          } catch (error) {
            console.error(`Error fetching ${index.name}:`, error);
          }
        }

        setIndices(fetchedIndices);

        // Set market stats (in a real app, these would come from an API)
        setMarketStats([
          { label: 'Market Volume', value: '$4.2T', change: '+2.3%', positive: true },
          { label: 'Market Cap', value: '$45.8T', change: '+1.1%', positive: true },
          { label: 'Volatility Index', value: '18.5', change: '-5.2%', positive: true },
          { label: 'Fear & Greed', value: '62 Greed', change: '+8.0', positive: true },
        ]);
      } catch (error) {
        console.error('Error fetching market overview:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketOverview();
  }, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch major indices
      const indicesToFetch = [
        { symbol: '^GSPC', name: 'S&P 500' },
        { symbol: '^DJI', name: 'Dow Jones' },
        { symbol: '^IXIC', name: 'NASDAQ' },
      ];

      const fetchedIndices: MarketIndex[] = [];

      for (const index of indicesToFetch) {
        try {
          const response = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(index.symbol)}`);
          const result = await response.json();

          if (result.success) {
            fetchedIndices.push({
              symbol: index.symbol,
              name: index.name,
              value: result.data.price,
              change: result.data.change,
              changePercent: result.data.changePercent,
              currency: result.data.currency || 'USD',
            });
          }
        } catch (error) {
          console.error(`Error fetching ${index.name}:`, error);
        }
      }

      setIndices(fetchedIndices);
    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Navigation onRefresh={handleRefresh} refreshing={refreshing} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Market Overview</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Real-time market data and analysis
          </p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {marketStats.map((stat, index) => (
            <Card key={index} className="p-6 bg-white dark:bg-slate-900 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Major Indices */}
        <Card className="p-6 mb-8 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Major Indices</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {indices.map((index) => {
              const isPositive = index.change >= 0;
              return (
                <Link
                  key={index.symbol}
                  href={`/instrument/${index.symbol}`}
                  className="block group"
                >
                  <Card className="p-4 hover:shadow-lg transition-all bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-lg">{index.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{index.symbol}</p>
                      </div>
                      <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {formatPriceInCurrency(index.value, index.currency)}
                      </span>
                      <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Top Movers */}
        <Card className="p-6 mb-8 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Top Movers</h2>
            </div>
          </div>
          <TopMovers />
        </Card>

        {/* Popular Stocks */}
        <Card className="p-6 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Popular Stocks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PriceCard symbol="AAPL" name="Apple Inc." type="STOCK" />
            <PriceCard symbol="GOOGL" name="Alphabet Inc." type="STOCK" />
            <PriceCard symbol="MSFT" name="Microsoft Corp." type="STOCK" />
            <PriceCard symbol="AMZN" name="Amazon.com Inc." type="STOCK" />
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Quick Links</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/compare">
              <Card className="p-4 hover:shadow-lg transition-all bg-white dark:bg-slate-900">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold mb-1">Compare Instruments</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Compare multiple stocks side by side</p>
              </Card>
            </Link>
            <Link href="/analyze">
              <Card className="p-4 hover:shadow-lg transition-all bg-white dark:bg-slate-900">
                <Activity className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold mb-1">Technical Analysis</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">View detailed technical indicators</p>
              </Card>
            </Link>
            <Link href="/simulate">
              <Card className="p-4 hover:shadow-lg transition-all bg-white dark:bg-slate-900">
                <Clock className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold mb-1">Investment Simulation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Simulate investment scenarios</p>
              </Card>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
