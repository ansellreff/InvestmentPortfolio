'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ForecastResult {
  symbol: string;
  name: string;
  currentValue: number;
  forecastValue: number;
  forecastMin: number;
  forecastMax: number;
  confidence: number;
  changePercent: number;
}

interface PortfolioForecastResultsProps {
  results: any[];
  horizon: number;
}

export function PortfolioForecastResults({ results, horizon }: PortfolioForecastResultsProps) {
  const forecasts = calculateForecasts(results, horizon);

  // Calculate portfolio totals
  const totalCurrent = forecasts.reduce((sum, f) => sum + f.currentValue, 0);
  const totalForecast = forecasts.reduce((sum, f) => sum + f.forecastValue, 0);
  const totalMin = forecasts.reduce((sum, f) => sum + f.forecastMin, 0);
  const totalMax = forecasts.reduce((sum, f) => sum + f.forecastMax, 0);
  const portfolioChange = totalForecast > 0 ? ((totalForecast - totalCurrent) / totalCurrent) * 100 : 0;
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

  const formatHorizon = (days: number) => {
    if (days < 365) return `${days} Days`;
    const years = days / 365;
    return `${years} Year${years > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Current Value</p>
            <p className="text-xl font-bold">${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Forecast ({formatHorizon(horizon)})</p>
            <p className="text-xl font-bold">${totalForecast.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Expected Change</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Confidence</p>
            <p className="text-xl font-bold">{Math.round(avgConfidence * 100)}%</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Forecast Range: ${totalMin.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${totalMax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </Card>

      {/* Individual Position Forecasts */}
      <div className="grid md:grid-cols-3 gap-4">
        {forecasts.map((forecast) => (
          <Card key={forecast.symbol} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{forecast.symbol}</h4>
                <p className="text-xs text-slate-500">{forecast.name}</p>
              </div>
              {forecast.changePercent >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Current:</span>
                <span className="font-medium">${forecast.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Forecast:</span>
                <span className={`font-medium ${forecast.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${forecast.forecastValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Range:</span>
                <span>${forecast.forecastMin.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${forecast.forecastMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  <span>{Math.round(forecast.confidence * 100)}% confidence</span>
                </div>
                <span className={`text-xs font-medium ${forecast.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {forecast.changePercent >= 0 ? '+' : ''}{forecast.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        <AlertCircle className="h-3 w-3 inline mr-1" />
        Forecasts are based on historical trends and do not guarantee future performance. Confidence decreases with longer time horizons.
      </p>
    </div>
  );
}

function calculateForecasts(results: any[], horizon: number): ForecastResult[] {
  return results.map((result) => {
    const historicalData = result.historicalData || [];
    const currentValue = result.currentValue || result.initialInvestment || 0;

    // Default conservative forecast if insufficient data
    if (historicalData.length < 5) {
      const forecastValue = currentValue * 1.02; // 2% annual growth default
      return {
        symbol: result.symbol,
        name: result.name,
        currentValue,
        forecastValue,
        forecastMin: currentValue * 0.95,
        forecastMax: currentValue * 1.10,
        confidence: 0.3,
        changePercent: 2,
      };
    }

    // Calculate trend from historical data
    const prices = historicalData.map((d: any) => d.price).filter((p: number) => p > 0);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const daysCovered = historicalData.length;

    // Calculate daily return rate
    const totalReturn = (lastPrice - firstPrice) / firstPrice;
    const dailyReturn = totalReturn / daysCovered;

    // Project forward
    const forecastReturn = dailyReturn * horizon;
    const forecastValue = Math.max(0, currentValue * (1 + forecastReturn));

    // Calculate volatility for confidence interval
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyRet = (prices[i] - prices[i-1]) / prices[i-1];
      if (isFinite(dailyRet)) {
        returns.push(dailyRet);
      }
    }

    let volatility = 0.02; // Default 2% daily volatility
    if (returns.length > 0) {
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      volatility = Math.sqrt(Math.max(0, variance));
    }

    // Confidence interval widens with time (square root rule)
    const timeAdjustedVolatility = volatility * Math.sqrt(horizon);
    const confidenceInterval = forecastValue * timeAdjustedVolatility * 2;

    // Confidence decreases with longer horizons
    const confidence = Math.max(0.25, 1 - (horizon / 3650) * 0.7);

    const changePercent = currentValue > 0 ? ((forecastValue - currentValue) / currentValue) * 100 : 0;

    return {
      symbol: result.symbol,
      name: result.name,
      currentValue,
      forecastValue: Math.max(0, forecastValue),
      forecastMin: Math.max(0, forecastValue - Math.abs(confidenceInterval)),
      forecastMax: forecastValue + Math.abs(confidenceInterval),
      confidence,
      changePercent,
    };
  });
}
