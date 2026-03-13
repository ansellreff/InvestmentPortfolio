'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target, Shield, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  bestDay: { date: string; gain: number } | null;
  worstDay: { date: string; loss: number } | null;
  benchmarkComparison: {
    symbol: string;
    return: number;
    portfolioReturn: number;
    beatBenchmark: boolean;
  } | null;
}

interface MetricsCardProps {
  metrics: PerformanceMetrics;
  currency?: string;
}

export function MetricsCard({ metrics, currency = 'USD' }: MetricsCardProps) {
  const { formatPrice } = useCurrency();

  const formatCurrency = (value: number) => {
    // Convert from USD to user's selected currency
    return formatPrice(value, currency);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getSharpeRating = (sharpe: number) => {
    if (sharpe > 2) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (sharpe > 1) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (sharpe > 0) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const sharpeRating = getSharpeRating(metrics.sharpeRatio);

  const metricItems = [
    {
      label: 'CAGR',
      value: formatPercent(metrics.cagr),
      description: 'Compound Annual Growth Rate',
      icon: <Target className="h-4 w-4" />,
      color: getTrendColor(metrics.cagr),
    },
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpeRatio.toFixed(2),
      description: 'Risk-adjusted return',
      rating: sharpeRating.label,
      ratingColor: sharpeRating.color,
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: 'Max Drawdown',
      value: formatPercent(metrics.maxDrawdown),
      description: 'Maximum peak to trough decline',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
    },
    {
      label: 'Volatility',
      value: formatPercent(metrics.volatility),
      description: 'Portfolio volatility',
      icon: <Activity className="h-4 w-4" />,
      color: 'text-slate-600',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance Metrics</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((metric) => (
          <div key={metric.label} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${metric.color || 'text-slate-600'}`}>
              {metric.icon}
            </div>
            <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
            <p className={`text-lg font-bold ${metric.color || 'text-slate-900 dark:text-white'}`}>
              {metric.value}
            </p>
            {metric.rating && (
              <Badge variant="secondary" className={`text-xs ${metric.ratingColor}`}>
                {metric.rating}
              </Badge>
            )}
            <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Best and Worst Day */}
      {(metrics.bestDay || metrics.worstDay) && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.bestDay && (
              <div className="text-center">
                <p className="text-xs text-slate-500">Best Day</p>
                <p className="text-sm font-semibold text-green-600">{metrics.bestDay.date}</p>
                <p className="text-sm text-green-600">+{formatCurrency(metrics.bestDay.gain)}</p>
              </div>
            )}
            {metrics.worstDay && (
              <div className="text-center">
                <p className="text-xs text-slate-500">Worst Day</p>
                <p className="text-sm font-semibold text-red-600">{metrics.worstDay.date}</p>
                <p className="text-sm text-red-600">-{formatCurrency(metrics.worstDay.loss)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benchmark Comparison */}
      {metrics.benchmarkComparison && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">vs S&P 500</p>
              <p className="text-sm text-slate-600">Benchmark: {metrics.benchmarkComparison.return}%</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${metrics.benchmarkComparison.beatBenchmark ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.benchmarkComparison.beatBenchmark ? 'Outperforming' : 'Underperforming'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
