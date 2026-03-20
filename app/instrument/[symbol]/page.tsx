'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessionalChart, OHLCVData, Timeframe } from '@/components/charts/ProfessionalChart';
import { AssetHistoryChart } from '@/components/charts/AssetHistoryChart';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useCurrency } from '@/hooks/useCurrency';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Activity,
  BarChart3,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react';

type InstrumentType = 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';

interface InstrumentData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  historicalData?: Array<{
    date: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators?: any;
  signal?: any;
  forecast?: any;
}

export default function InstrumentPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  const [data, setData] = useState<InstrumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');

  const { formatPrice: formatPriceInCurrency } = useCurrency();
  const { selectedInstruments, addInstrument, removeInstrument } = useComparisonStore();

  const isInComparison = selectedInstruments.some(i => i.symbol === symbol);

  // Determine instrument type
  const getInstrumentType = (sym: string): { type: InstrumentType; isMetal: boolean } => {
    const upper = sym.toUpperCase();
    if (['GOLD', 'GC=F', 'XAU'].includes(upper)) return { type: 'GOLD', isMetal: true };
    if (['SILVER', 'SI=F', 'XAG'].includes(upper)) return { type: 'SILVER', isMetal: true };
    if (['PLATINUM', 'PL=F', 'XPT'].includes(upper)) return { type: 'PLATINUM', isMetal: true };
    if (['PALLADIUM', 'PA=F', 'XPD'].includes(upper)) return { type: 'PALLADIUM', isMetal: true };
    if (upper.includes('-USD') || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT'].some(c => upper.includes(c))) {
      return { type: 'CRYPTO', isMetal: false };
    }
    return { type: 'STOCK', isMetal: false };
  };

  const { type: instrumentType, isMetal } = getInstrumentType(symbol);

  useEffect(() => {
    async function fetchInstrumentData() {
      try {
        setLoading(true);
        setError(null);

        // Determine API endpoints
        let priceEndpoint = '';
        let historyEndpoint = '';

        if (instrumentType === 'GOLD') {
          priceEndpoint = '/api/gold/price';
          historyEndpoint = `/api/gold/history?days=${timeframeToDays(timeframe)}`;
        } else if (instrumentType === 'SILVER') {
          priceEndpoint = '/api/silver/price';
          historyEndpoint = `/api/silver/history?days=${timeframeToDays(timeframe)}`;
        } else if (instrumentType === 'PLATINUM') {
          priceEndpoint = '/api/platinum/price';
          historyEndpoint = `/api/platinum/history?days=${timeframeToDays(timeframe)}`;
        } else if (instrumentType === 'PALLADIUM') {
          priceEndpoint = '/api/palladium/price';
          historyEndpoint = `/api/palladium/history?days=${timeframeToDays(timeframe)}`;
        } else if (instrumentType === 'CRYPTO') {
          const apiSymbol = symbol.toUpperCase().includes('-') ? symbol.toUpperCase() : `${symbol.toUpperCase()}-USD`;
          priceEndpoint = `/api/crypto/price?symbol=${apiSymbol}`;
          historyEndpoint = `/api/crypto/history?symbol=${apiSymbol}&days=${timeframeToDays(timeframe)}`;
        } else {
          const apiSymbol = symbol.toUpperCase().includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.JK`;
          priceEndpoint = `/api/stocks/price?symbol=${apiSymbol}`;
          historyEndpoint = `/api/stocks/history?symbol=${apiSymbol}&days=${timeframeToDays(timeframe)}`;
        }

        // Fetch current price
        const priceResponse = await fetch(priceEndpoint);
        const priceResult = await priceResponse.json();

        if (!priceResult.success) {
          throw new Error(priceResult.error || 'Failed to fetch price data');
        }

        // Fetch historical data
        const historyResponse = await fetch(historyEndpoint);
        const historyResult = await historyResponse.json();

        if (!historyResult.success) {
          throw new Error(historyResult.error || 'Failed to fetch historical data');
        }

        setData({
          symbol: priceResult.data.symbol,
          name: priceResult.data.name,
          price: priceResult.data.price,
          change: priceResult.data.change || 0,
          changePercent: priceResult.data.changePercent || 0,
          currency: priceResult.data.currency,
          historicalData: historyResult.data.historicalData,
          indicators: historyResult.data.indicators,
          signal: historyResult.data.signal,
          forecast: historyResult.data.forecast,
        });
      } catch (err) {
        console.error('Error fetching instrument data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load instrument data');
      } finally {
        setLoading(false);
      }
    }
    fetchInstrumentData();
  }, [symbol, instrumentType, timeframe]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Re-fetch logic (simplified for brevity - in production would extract to function)
      window.location.reload();
    } catch (err) {
      setRefreshing(false);
    }
  };

  const handleToggleComparison = () => {
    if (!data) return;

    if (isInComparison) {
      removeInstrument(symbol);
    } else {
      addInstrument({
        symbol: data.symbol,
        name: data.name,
        type: instrumentType,
        price: data.price,
        currency: data.currency,
      });
    }
  };

  const timeframeToDays = (tf: Timeframe): number => {
    const map: Record<Timeframe, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '5Y': 365 * 5,
      'ALL': 365 * 20,
    };
    return map[tf] || 90;
  };

  const convertToOHLCV = (historicalData: any[]): OHLCVData[] => {
    if (!historicalData) return [];

    // Convert to OHLCV format and handle duplicate timestamps
    const dataMap = new Map<number, OHLCVData>();

    historicalData.forEach(d => {
      const time = Math.floor(new Date(d.date).getTime() / 1000);

      // If we already have this timestamp, update the existing entry
      // This handles cases where multiple entries have the same timestamp
      if (dataMap.has(time)) {
        const existing = dataMap.get(time)!;
        // Update high/low to be the max/min of both entries
        dataMap.set(time, {
          time,
          open: existing.open,
          high: Math.max(existing.high, d.high ?? d.price),
          low: Math.min(existing.low, d.low ?? d.price),
          close: d.close ?? d.price, // Use the latest close
          volume: (existing.volume || 0) + (d.volume || 0),
        });
      } else {
        dataMap.set(time, {
          time,
          open: d.open ?? d.price,
          high: d.high ?? d.price,
          low: d.low ?? d.price,
          close: d.close ?? d.price,
          volume: d.volume,
        });
      }
    });

    // Convert map to array and sort by time ascending
    const result = Array.from(dataMap.values()).sort((a, b) => a.time - b.time);

    return result;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'GOLD': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'SILVER': return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case 'PLATINUM': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'PALLADIUM': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'CRYPTO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          {/* Loading Cards */}
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-6" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Unable to Load Instrument</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || 'Failed to load instrument data'}
            </p>
            <Button onClick={() => router.push('/')}>Return Home</Button>
          </Card>
        </div>
      </div>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{data.symbol}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{data.name}</p>
          </div>
        </div>
        {/* Price Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Price */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Current Price
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatPriceInCurrency(data.price, data.currency)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </Card>

          {/* Change */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Change
                </p>
                <p className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}{formatPriceInCurrency(data.change, data.currency)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isPositive ? (
                  <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Minus className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </Card>

          {/* Change Percent */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Change %
                </p>
                <p className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <Percent className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 h-full">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleToggleComparison}
                variant={isInComparison ? 'destructive' : 'default'}
                size="sm"
                className="flex-1"
              >
                {isInComparison ? (
                  <>Remove</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Compare
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="p-6 bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Price Chart</h2>
                <p className="text-sm text-slate-500">Professional candlestick chart with indicators</p>
              </div>
            </div>
            <Badge className={getTypeColor(instrumentType)}>
              {instrumentType}
            </Badge>
          </div>
          {data.historicalData && data.historicalData.length > 0 ? (
            <ProfessionalChart
              symbol={data.symbol}
              name={data.name}
              initialData={convertToOHLCV(data.historicalData)}
              height={500}
              currency={data.currency}
              showVolume={true}
              defaultChartType="candlestick"
              defaultTimeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400">No historical data available</p>
              </div>
            </div>
          )}
        </Card>

        {/* Asset History Chart */}
        <AssetHistoryChart
          symbol={data.symbol}
          instrumentType={instrumentType}
          currency={data.currency}
          height={350}
        />

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">About {data.symbol}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{data.name}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Real-time Data</Badge>
                <Badge variant="outline" className="text-xs">Professional Charts</Badge>
                <Badge variant="outline" className="text-xs">Technical Indicators</Badge>
                <Badge variant="outline" className="text-xs">Volume Analysis</Badge>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
