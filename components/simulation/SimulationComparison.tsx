'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface SimulationResult {
  symbol: string;
  name: string;
  type: string;
  initialInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalUnits: number;
  avgPricePerUnit: number;
  currentPrice: number;
  currency: string;
  historicalData: Array<{ date: string; price: number; value: number }>;
}

interface SimulationComparisonProps {
  results: SimulationResult[];
}

const COLORS = ['#3B82F6', '#00C853', '#F59E0B', '#EF4444', '#8B5CF6'];

export function SimulationComparison({ results }: SimulationComparisonProps) {
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  const formatCurrency = (value: number, currency: string) => {
    return formatPriceInCurrency(value, currency);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Find best performer
  const bestPerformer = results.reduce((best, current) =>
    current.profitLossPercent > best.profitLossPercent ? current : best
  );

  // Prepare comparison chart data
  const maxLength = Math.max(...results.map(r => r.historicalData.length));
  const comparisonData = Array.from({ length: maxLength }, (_, i) => {
    const entry: any = { index: i };
    results.forEach((result, idx) => {
      const dataPoint = result.historicalData[i];
      if (dataPoint) {
        entry[result.symbol] = dataPoint.value;
        entry[`${result.symbol}_date`] = dataPoint.date;
      }
    });
    return entry;
  }).filter(entry => Object.keys(entry).length > 1);

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <Card className={`p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800`}>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Best Performer</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {bestPerformer.symbol} - {bestPerformer.name}
            </h3>
            <p className={`text-lg font-semibold ${bestPerformer.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(bestPerformer.profitLossPercent)} Return
            </p>
          </div>
        </div>
      </Card>

      {/* Comparison Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="index"
              tickFormatter={(value) => {
                const firstResult = results[0];
                const dateKey = `${firstResult.symbol}_date`;
                const date = comparisonData[value]?.[dateKey];
                return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '';
              }}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, results[0]?.currency || 'USD')}
              className="text-xs"
            />
            <Tooltip
              formatter={(value?: number, name?: string) => [formatCurrency(value || 0, results[0]?.currency || 'USD'), name || '']}
              labelFormatter={(value) => {
                const firstResult = results[0];
                const dateKey = `${firstResult.symbol}_date`;
                const date = comparisonData[value]?.[dateKey];
                return date ? new Date(date).toLocaleDateString() : '';
              }}
            />
            <Legend />
            {results.map((result, idx) => (
              <Line
                key={result.symbol}
                type="monotone"
                dataKey={result.symbol}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={result.symbol}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparison Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Instrument</th>
                <th className="text-right p-3 font-semibold">Initial Investment</th>
                <th className="text-right p-3 font-semibold">Current Value</th>
                <th className="text-right p-3 font-semibold">Profit/Loss</th>
                <th className="text-right p-3 font-semibold">Return %</th>
                <th className="text-right p-3 font-semibold">Units Owned</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr key={result.symbol} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <div>
                        <p className="font-semibold">{result.symbol}</p>
                        <p className="text-xs text-slate-500">{result.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(result.initialInvestment, result.currency)}
                  </td>
                  <td className="text-right p-3 font-medium">
                    {formatCurrency(result.currentValue, result.currency)}
                  </td>
                  <td className={`text-right p-3 font-medium ${
                    result.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.profitLoss >= 0 ? '+' : ''}{formatCurrency(result.profitLoss, result.currency)}
                  </td>
                  <td className="text-right p-3">
                    <Badge variant={result.profitLossPercent >= 0 ? 'default' : 'destructive'}>
                      {formatPercent(result.profitLossPercent)}
                    </Badge>
                  </td>
                  <td className="text-right p-3 font-medium">
                    {result.totalUnits.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Key Insights</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Highest Return</p>
            <p className="font-bold text-lg">
              {bestPerformer.symbol} ({formatPercent(bestPerformer.profitLossPercent)})
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Value Created</p>
            <p className="font-bold text-lg">
              {formatCurrency(
                results.reduce((sum, r) => sum + r.profitLoss, 0),
                results[0]?.currency || 'USD'
              )}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Invested</p>
            <p className="font-bold text-lg">
              {formatCurrency(
                results.reduce((sum, r) => sum + r.initialInvestment, 0),
                results[0]?.currency || 'USD'
              )}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Winning Investments</p>
            <p className="font-bold text-lg">
              {results.filter(r => r.profitLossPercent > 0).length} / {results.length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
