'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { ExcelExport } from '@/components/export/ExcelExport';
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

interface SimulationResultsProps {
  results: SimulationResult[];
  onReset: () => void;
}

export function SimulationResults({ results, onReset }: SimulationResultsProps) {
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  if (results.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Run a simulation to see investment performance results
        </p>
        <Button onClick={onReset} variant="outline">
          Back to Setup
        </Button>
      </Card>
    );
  }

  const formatCurrency = (value: number, currency: string) => {
    return formatPriceInCurrency(value, currency);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Invested</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  results.reduce((sum, r) => sum + r.initialInvestment, 0),
                  results[0]?.currency || 'USD'
                )}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Current Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  results.reduce((sum, r) => sum + r.currentValue, 0),
                  results[0]?.currency || 'USD'
                )}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total P&L</p>
              <p className={`text-2xl font-bold ${
                results.reduce((sum, r) => sum + r.profitLoss, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(
                  results.reduce((sum, r) => sum + r.profitLoss, 0),
                  results[0]?.currency || 'USD'
                )}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Individual Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {results.map((result) => {
          const isProfitable = result.profitLoss >= 0;

          return (
            <Card key={result.symbol} className="overflow-hidden">
              {/* Header */}
              <div className={`p-4 ${isProfitable ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{result.symbol}</h3>
                      <Badge variant="outline">{result.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{result.name}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="text-lg font-bold">
                      {isProfitable ? '+' : ''}{result.profitLossPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Initial Investment</p>
                    <p className="font-semibold">{formatCurrency(result.initialInvestment, result.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Value</p>
                    <p className="font-semibold">{formatCurrency(result.currentValue, result.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Profit/Loss</p>
                    <p className={`font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfitable ? '+' : ''}{formatCurrency(result.profitLoss, result.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Units</p>
                    <p className="font-semibold">{formatNumber(result.totalUnits)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Avg Price/Unit</p>
                    <p className="font-semibold">{formatCurrency(result.avgPricePerUnit, result.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Price</p>
                    <p className="font-semibold">{formatCurrency(result.currentPrice, result.currency)}</p>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Investment Performance Over Time</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={result.historicalData}>
                      <defs>
                        <linearGradient id={`color-${result.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isProfitable ? '#00C853' : '#FF3D00'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isProfitable ? '#00C853' : '#FF3D00'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        className="text-xs"
                      />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value, result.currency)}
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value?: number) => formatCurrency(value || 0, result.currency)}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={isProfitable ? '#00C853' : '#FF3D00'}
                        fillOpacity={1}
                        fill={`url(#color-${result.symbol})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions & Export */}
      <div className="grid md:grid-cols-2 gap-6">
        <ExcelExport data={results} type="simulation" />
        <Card className="p-6">
          <div className="flex items-center justify-between h-full">
            <div>
              <h3 className="font-bold mb-1">Run Another Simulation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Start fresh with new parameters
              </p>
            </div>
            <Button onClick={onReset} size="lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              New Simulation
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
