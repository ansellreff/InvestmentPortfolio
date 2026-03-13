'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface TechnicalIndicatorsChartProps {
  data: Array<{ date: string; price: number; rsi?: number; macd?: number }>;
  showRSI?: boolean;
  showMACD?: boolean;
  showBollingerBands?: boolean;
}

export function TechnicalIndicatorsChart({
  data,
  showRSI = true,
  showMACD = true,
  showBollingerBands = true,
}: TechnicalIndicatorsChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* RSI Chart */}
      {showRSI && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">RSI (14)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="displayDate"
                className="text-xs text-slate-600 dark:text-slate-400"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs text-slate-600 dark:text-slate-400"
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded shadow border text-xs">
                      <p className="font-medium">RSI: {payload[0].value?.toFixed(2)}</p>
                      {payload[0].value && payload[0].value > 70 && <p className="text-red-500">Overbought</p>}
                      {payload[0].value && payload[0].value < 30 && <p className="text-green-500">Oversold</p>}
                    </div>
                  );
                }}
              />
              <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.1} />
              <ReferenceArea y1={0} y2={30} fill="#22c55e" fillOpacity={0.1} />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Chart */}
      {showMACD && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">MACD</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="displayDate"
                className="text-xs text-slate-600 dark:text-slate-400"
                tick={{ fontSize: 10 }}
              />
              <YAxis className="text-xs text-slate-600 dark:text-slate-400" tick={{ fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded shadow border text-xs">
                      {payload.map((entry: any, i: number) => (
                        <p key={i} style={{ color: entry.color }}>
                          {entry.name}: {entry.value?.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar dataKey="macd" fill="#3b82f6" name="MACD" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
