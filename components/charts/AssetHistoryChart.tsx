'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export type AssetHistoryTimeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface AssetHistoryData {
  date: string;
  price: number;
  value?: number;
}

interface AssetHistoryChartProps {
  symbol: string;
  instrumentType: 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO' | 'STOCK';
  currency: string;
  height?: number;
  showValueHistory?: boolean;
  positionQuantity?: number;
}

const TIMEFRAME_LABELS: Record<AssetHistoryTimeframe, string> = {
  '1D': '24 Hours',
  '1W': '7 Days',
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  'ALL': 'All Time',
};

const TIMEFRAME_TO_DAYS: Record<AssetHistoryTimeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'ALL': 365 * 5,
};

export function AssetHistoryChart({
  symbol,
  instrumentType,
  currency,
  height = 300,
  showValueHistory = false,
  positionQuantity,
}: AssetHistoryChartProps) {
  const [timeframe, setTimeframe] = useState<AssetHistoryTimeframe>('1M');
  const [historyData, setHistoryData] = useState<AssetHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const days = TIMEFRAME_TO_DAYS[timeframe];
      let endpoint = '';

      // Determine endpoint based on instrument type
      if (instrumentType === 'GOLD') {
        endpoint = `/api/gold/history?days=${days}`;
      } else if (instrumentType === 'SILVER') {
        endpoint = `/api/silver/history?days=${days}`;
      } else if (instrumentType === 'PLATINUM') {
        endpoint = `/api/platinum/history?days=${days}`;
      } else if (instrumentType === 'PALLADIUM') {
        endpoint = `/api/palladium/history?days=${days}`;
      } else if (instrumentType === 'CRYPTO') {
        const apiSymbol = symbol.toUpperCase().includes('-') ? symbol.toUpperCase() : `${symbol.toUpperCase()}-USD`;
        endpoint = `/api/crypto/history?symbol=${apiSymbol}&days=${days}`;
      } else {
        const apiSymbol = symbol.toUpperCase().includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.JK`;
        endpoint = `/api/stocks/history?symbol=${apiSymbol}&days=${days}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success && result.data.historicalData) {
        let data = result.data.historicalData.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          price: d.price || d.close,
        }));

        // If showing value history (for portfolio positions), calculate value
        if (showValueHistory && positionQuantity) {
          data = data.map((d: AssetHistoryData) => ({
            ...d,
            value: d.price * positionQuantity,
          }));
        }

        setHistoryData(data.reverse()); // Show oldest to newest
      } else {
        throw new Error(result.error || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching asset history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [timeframe, symbol, instrumentType]);

  // Calculate statistics
  const calculateStats = () => {
    if (historyData.length < 2) return null;

    const prices = historyData.map((d) => d.price);
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[0];
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    const high = Math.max(...prices);
    const low = Math.min(...prices);

    return {
      current: currentPrice,
      previous: previousPrice,
      change,
      changePercent,
      high,
      low,
    };
  };

  const stats = calculateStats();

  // Format data for chart
  const chartData = historyData.map((d) => {
    if (showValueHistory && d.value) {
      return {
        date: d.date,
        Price: d.price,
        Value: d.value,
      };
    }
    return {
      date: d.date,
      Price: d.price,
    };
  });

  // Determine chart color based on performance
  const isPositive = stats && stats.change >= 0;
  const chartColor = isPositive ? '#22C55E' : '#EF4444';
  const chartGradient = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showValueHistory ? 'Portfolio Value History' : 'Price History'}
            </CardTitle>
            {stats && (
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-xs text-slate-500">
                    {showValueHistory ? 'Current Value' : 'Current Price'}
                  </p>
                  <p className="text-lg font-bold">
                    {formatPrice(showValueHistory ? stats.current * (positionQuantity || 1) : stats.current, currency)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    ({TIMEFRAME_LABELS[timeframe]})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-1">
            {(Object.keys(TIMEFRAME_LABELS) as AssetHistoryTimeframe[]).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="h-8 px-3 text-xs"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading history...</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchHistory} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        ) : historyData.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <p className="text-sm text-slate-500">No historical data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`colorGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-slate-500"
                tickFormatter={(value) => {
                  // Show fewer ticks for longer timeframes
                  if (['1M', '3M', '6M', '1Y', 'ALL'].includes(timeframe)) {
                    const index = chartData.findIndex((d) => d.date === value);
                    return index % Math.ceil(chartData.length / 6) === 0 ? value : '';
                  }
                  return value;
                }}
              />
              <YAxis
                className="text-xs text-slate-500"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toFixed(0);
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number | undefined, name?: string) => {
                  if (name === 'Price' || name === 'Value') {
                    return [formatPrice(value ?? 0, currency), name];
                  }
                  return [value ?? 0, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="Price"
                stroke={chartColor}
                fillOpacity={1}
                fill={`url(#colorGradient-${symbol})`}
                strokeWidth={2}
              />
              {showValueHistory && (
                <Area
                  type="monotone"
                  dataKey="Value"
                  stroke="#8B5CF6"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Stats Footer */}
        {stats && !loading && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-slate-500">High</p>
              <p className="font-semibold text-green-600">{formatPrice(stats.high, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Low</p>
              <p className="font-semibold text-red-600">{formatPrice(stats.low, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Change</p>
              <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(Math.abs(stats.change), currency)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
