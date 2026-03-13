'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PriceData {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: PriceData[];
  symbol: string;
  color?: string;
  showArea?: boolean;
  showForecast?: boolean;
  forecastData?: Array<{ date: string; price: number; confidence?: number }>;
  supportLevel?: number;
  resistanceLevel?: number;
  formatPrice?: (price: number) => string;
}

export function PriceChart({
  data,
  symbol,
  color = '#3b82f6',
  showArea = false,
  showForecast = false,
  forecastData,
  supportLevel,
  resistanceLevel,
  formatPrice = (price) => price.toLocaleString(),
}: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  const combinedData = useMemo(() => {
    if (!showForecast || !forecastData) return chartData;

    const historicalWithNull = chartData.map((d) => ({ ...d, forecast: null }));
    const forecastWithPadding = forecastData.map((d, i) => ({
      displayDate: new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      price: null as number | null,
      forecast: d.price,
      confidence: d.confidence,
    }));

    return [...historicalWithNull, ...forecastWithPadding];
  }, [chartData, showForecast, forecastData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatPrice(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={combinedData}>
        <defs>
          <linearGradient id={`colorGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`forecastGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="displayDate"
          className="text-xs text-slate-600 dark:text-slate-400"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          className="text-xs text-slate-600 dark:text-slate-400"
          tick={{ fontSize: 11 }}
          tickFormatter={formatPrice}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {supportLevel && (
          <ReferenceLine
            y={supportLevel}
            label="Support"
            stroke="#22c55e"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
        )}
        {resistanceLevel && (
          <ReferenceLine
            y={resistanceLevel}
            label="Resistance"
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
        )}

        {showArea ? (
          <>
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#colorGradient-${symbol})`}
              name={`${symbol} Price`}
            />
            {showForecast && (
              <Area
                type="monotone"
                dataKey="forecast"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill={`url(#forecastGradient-${symbol})`}
                name="Forecast"
              />
            )}
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              dot={false}
              name={`${symbol} Price`}
            />
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Forecast"
              />
            )}
          </>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
