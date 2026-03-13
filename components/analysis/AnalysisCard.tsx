'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Activity } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface AnalysisCardProps {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  signal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    reasons: string[];
  };
  forecast: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    trendStrength: number;
    supportLevel: number;
    resistanceLevel: number;
    targetPrice: number;
    stopLoss: number;
  };
  indicators?: {
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    sma20: number;
    sma50: number;
  };
}

export function AnalysisCard({
  symbol,
  name,
  currentPrice,
  currency,
  signal,
  forecast,
  indicators,
}: AnalysisCardProps) {
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  const formatPrice = (price: number | undefined | null) => {
    // Validate price is a valid number
    if (price === null || price === undefined || typeof price !== 'number' || !isFinite(price)) {
      return currency === 'USD' ? '$0.00' : 'Rp 0';
    }
    return formatPriceInCurrency(price, currency);
  };

  const getSignalColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'BULLISH':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'BEARISH':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Overbought', color: 'text-red-600' };
    if (rsi < 30) return { status: 'Oversold', color: 'text-green-600' };
    return { status: 'Neutral', color: 'text-slate-600' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">{name}</p>
          </div>
          <Badge className={getSignalColor(signal.action)}>
            {signal.action} ({signal.strength}% confidence)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Current Price</p>
          <p className="text-2xl font-bold">
            {currentPrice !== null && currentPrice !== undefined && isFinite(currentPrice)
              ? formatPrice(currentPrice)
              : 'Loading...'}
          </p>
        </div>

        {/* Trend Analysis */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            {getTrendIcon(forecast.trend)}
            <div>
              <p className="text-sm font-medium">{forecast.trend} Trend</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Strength: {forecast.trendStrength}%
              </p>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
              <Activity className="h-3 w-3" />
              <p className="text-xs font-medium">Support</p>
            </div>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">
              {formatPrice(forecast.supportLevel)}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-1 text-red-700 dark:text-red-300">
              <Activity className="h-3 w-3" />
              <p className="text-xs font-medium">Resistance</p>
            </div>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              {formatPrice(forecast.resistanceLevel)}
            </p>
          </div>
        </div>

        {/* Target & Stop Loss */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <Target className="h-3 w-3" />
              <p className="text-xs font-medium">Target</p>
            </div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {formatPrice(forecast.targetPrice)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentPrice > 0 ? ((forecast.targetPrice / currentPrice - 1) * 100).toFixed(2) : '0.00'}%
            </p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
              <ShieldAlert className="h-3 w-3" />
              <p className="text-xs font-medium">Stop Loss</p>
            </div>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
              {formatPrice(forecast.stopLoss)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentPrice > 0 ? ((forecast.stopLoss / currentPrice - 1) * 100).toFixed(2) : '0.00'}%
            </p>
          </div>
        </div>

        {/* Technical Indicators */}
        {indicators && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Technical Indicators
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">RSI (14):</span>
                <span className={`font-medium ${getRSIStatus(indicators.rsi).color}`}>
                  {indicators.rsi.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">SMA 20:</span>
                <span className="font-medium">{formatPrice(indicators.sma20)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">SMA 50:</span>
                <span className="font-medium">{formatPrice(indicators.sma50)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">MACD:</span>
                <span className={`font-medium ${indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {indicators.macd.histogram.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signal Reasons */}
        {signal.reasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Analysis Reasons
            </p>
            <div className="space-y-1">
              {signal.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
