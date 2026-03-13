/**
 * Forecasting Library
 * Price prediction and trend analysis
 */

export interface PriceData {
  date: string;
  price: number;
}

export interface ForecastResult {
  predictions: Array<{
    date: string;
    price: number;
    confidence: number;
  }>;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendStrength: number; // 0-100
  supportLevel: number;
  resistanceLevel: number;
  targetPrice: number;
  stopLoss: number;
}

/**
 * Calculate linear regression for trend analysis
 */
export function calculateLinearRegression(prices: number[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = prices.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = prices;

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, r2 };
}

/**
 * Generate forecast using moving average crossover and linear regression
 */
export function generateForecast(
  historicalPrices: number[],
  periods: number = 30
): ForecastResult {
  // Validate input
  if (!historicalPrices || !Array.isArray(historicalPrices) || historicalPrices.length < 20) {
    const lastPrice = (historicalPrices && historicalPrices.length > 0)
      ? historicalPrices[historicalPrices.length - 1]
      : 0;

    return {
      predictions: Array.from({ length: periods }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: lastPrice || 0,
        confidence: 10,
      })),
      trend: 'NEUTRAL',
      trendStrength: 50,
      supportLevel: (lastPrice || 0) * 0.95,
      resistanceLevel: (lastPrice || 0) * 1.05,
      targetPrice: lastPrice || 0,
      stopLoss: (lastPrice || 0) * 0.98,
    };
  }

  // Calculate linear regression
  const { slope, intercept, r2 } = calculateLinearRegression(historicalPrices);
  const lastPrice = historicalPrices[historicalPrices.length - 1];

  // Determine trend
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let trendStrength = 50;

  if (slope > 0.1) {
    trend = 'BULLISH';
    trendStrength = Math.min(95, 50 + Math.abs(slope) * 100);
  } else if (slope < -0.1) {
    trend = 'BEARISH';
    trendStrength = Math.min(95, 50 + Math.abs(slope) * 100);
  }

  // Calculate support and resistance
  const minPrice = Math.min(...historicalPrices.slice(-20));
  const maxPrice = Math.max(...historicalPrices.slice(-20));
  const volatility = (maxPrice - minPrice) / lastPrice;

  const supportLevel = minPrice;
  const resistanceLevel = maxPrice;

  // Calculate target and stop loss based on trend
  const targetPrice = trend === 'BULLISH'
    ? lastPrice * (1 + volatility * 0.5)
    : trend === 'BEARISH'
    ? lastPrice * (1 - volatility * 0.5)
    : lastPrice;

  const stopLoss = trend === 'BULLISH'
    ? lastPrice * (1 - volatility * 0.2)
    : trend === 'BEARISH'
    ? lastPrice * (1 + volatility * 0.2)
    : lastPrice * 0.98;

  // Generate predictions
  const predictions: Array<{ date: string; price: number; confidence: number }> = [];
  const baseConfidence = Math.round(r2 * 80);

  for (let i = 1; i <= periods; i++) {
    const predictedPrice = intercept + slope * (historicalPrices.length + i - 1);

    // Calculate uncertainty bounds based on volatility (deterministic)
    const uncertainty = (maxPrice - minPrice) / lastPrice * 0.1 * (i / periods);
    const finalPrice = predictedPrice + (slope >= 0 ? 1 : -1) * uncertainty * 0.5;

    // Confidence decreases over time
    const confidence = Math.max(20, baseConfidence - (i / periods) * 30);

    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.max(0, finalPrice),
      confidence,
    });
  }

  return {
    predictions,
    trend,
    trendStrength: Math.round(trendStrength),
    supportLevel,
    resistanceLevel,
    targetPrice,
    stopLoss,
  };
}

/**
 * Calculate price change percentage
 */
export function calculatePriceChange(currentPrice: number, previousPrice: number): {
  change: number;
  percentChange: number;
} {
  const change = currentPrice - previousPrice;
  const percentChange = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
  return { change, percentChange };
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < Math.min(prices.length, period + 1); i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(ret);
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}

/**
 * Calculate correlation between two price series
 */
export function calculateCorrelation(prices1: number[], prices2: number[]): number {
  const n = Math.min(prices1.length, prices2.length);
  if (n < 2) return 0;

  const slice1 = prices1.slice(-n);
  const slice2 = prices2.slice(-n);

  const mean1 = slice1.reduce((sum, p) => sum + p, 0) / n;
  const mean2 = slice2.reduce((sum, p) => sum + p, 0) / n;

  let numerator = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = slice1[i] - mean1;
    const diff2 = slice2[i] - mean2;
    numerator += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(variance1 * variance2);
  return denominator > 0 ? numerator / denominator : 0;
}
