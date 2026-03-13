'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { convertCurrencySync } from '@/lib/utils/currencyConversion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TradingChartProps {
  symbol: string;
  name: string;
  initialData?: Array<{ date: string; price: number; volume?: number; open?: number; high?: number; low?: number; close?: number }>;
  height?: number;
  currency?: string;
}

export function TradingChart({ symbol, name, initialData, height = 400, currency: propCurrency }: TradingChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isUp, setIsUp] = useState<boolean>(false);
  const { convertPrice, targetCurrency } = useCurrency();

  // Determine original currency from symbol if not provided
  const originalCurrency = propCurrency || (symbol.includes('.JK') ? 'IDR' : 'USD');

  // Convert price to target currency
  const { price: displayPrice } = convertPrice(currentPrice || 0, originalCurrency);
  const currency = targetCurrency;

  // Prepare chart data with currency conversion
  const data = initialData?.map((item) => {
    const convertedPrice = convertCurrencySync(item.price, originalCurrency, targetCurrency);
    return {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: convertedPrice,
      value: convertedPrice,
    };
  }) || [];

  // Calculate current price and change
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const latest = initialData[initialData.length - 1];
      const first = initialData[0];
      const change = ((latest.price - first.price) / first.price) * 100;
      setCurrentPrice(latest.price);
      setPriceChange(change);
      setIsUp(change >= 0);
    }
  }, [initialData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrencyUtil(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Price Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{symbol}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{name}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            {isUp ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-2xl font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrencyUtil(displayPrice, currency)}
            </span>
          </div>
          <span className="text-sm text-slate-500">
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% 24h
          </span>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={chartType === 'area' ? 'default' : 'outline'}
          onClick={() => setChartType('area')}
        >
          Area
        </Button>
        <Button
          size="sm"
          variant={chartType === 'line' ? 'default' : 'outline'}
          onClick={() => setChartType('line')}
        >
          Line
        </Button>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return value.toFixed(0);
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return value.toFixed(0);
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Activity className="h-12 w-12 mr-3" />
            <span>Loading chart data...</span>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-slate-500">Data Points</p>
          <p className="text-lg font-bold">{data.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Currency</p>
          <p className="text-lg font-bold">{currency}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">24h Change</p>
          <p className={`text-lg font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
