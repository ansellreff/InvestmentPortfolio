/**
 * Technical Analysis Library
 * Calculate various technical indicators for financial analysis
 */

export interface PriceData {
  date: string;
  price: number;
  volume?: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number[];
  resistance: number[];
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number {
  if (!prices || !Array.isArray(prices) || prices.length < period || period <= 0) return 0;
  const slice = prices.slice(-period);
  if (slice.length === 0) return 0;
  return slice.reduce((sum, price) => sum + (price || 0), 0) / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Returns the current MACD, signal line (9-period EMA of MACD), and histogram
 */
export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (!prices || prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // Calculate EMAs
  const ema12Values: number[] = [];
  const ema26Values: number[] = [];
  const macdValues: number[] = [];

  // Calculate EMA12
  const multiplier12 = 2 / (12 + 1);
  let ema12 = prices.slice(0, 12).reduce((sum, price) => sum + price, 0) / 12;
  ema12Values.push(ema12);

  for (let i = 12; i < prices.length; i++) {
    ema12 = (prices[i] - ema12) * multiplier12 + ema12;
    ema12Values.push(ema12);
  }

  // Calculate EMA26
  const multiplier26 = 2 / (26 + 1);
  let ema26 = prices.slice(0, 26).reduce((sum, price) => sum + price, 0) / 26;
  ema26Values.push(ema26);

  for (let i = 26; i < prices.length; i++) {
    ema26 = (prices[i] - ema26) * multiplier26 + ema26;
    ema26Values.push(ema26);
  }

  // Calculate MACD values (EMA12 - EMA26)
  // Start from index where both EMAs are available
  const startIndex = 26 - 12; // Offset to align the arrays
  for (let i = 0; i < ema26Values.length; i++) {
    const ema12Index = Math.max(0, i - startIndex);
    macdValues.push(ema12Values[ema12Index] - ema26Values[i]);
  }

  // Calculate Signal Line (9-period EMA of MACD)
  const currentMACD = macdValues[macdValues.length - 1];
  const signalMultiplier = 2 / (9 + 1);

  // Use the last 9 MACD values (or fewer if not available)
  const signalPeriod = Math.min(9, macdValues.length);
  const macdForSignal = macdValues.slice(-signalPeriod);
  let signalEMA = macdForSignal[0];

  for (let i = 1; i < macdForSignal.length; i++) {
    signalEMA = (macdForSignal[i] - signalEMA) * signalMultiplier + signalEMA;
  }

  const histogram = currentMACD - signalEMA;

  return { macd: currentMACD, signal: signalEMA, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((sum, price) => sum + price, 0) / period;

  const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: middle + (stdDev * std),
    middle,
    lower: middle - (stdDev * std),
  };
}

/**
 * Find Support and Resistance Levels
 */
export function findSupportResistance(prices: number[], lookback: number = 20): { support: number[]; resistance: number[] } {
  if (prices.length < lookback * 2) {
    return { support: [], resistance: [] };
  }

  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = lookback; i < prices.length - lookback; i++) {
    const slice = prices.slice(i - lookback, i + lookback + 1);
    const currentPrice = prices[i];

    const isLocalMin = slice.every((price, idx) => idx === lookback || price >= currentPrice);
    const isLocalMax = slice.every((price, idx) => idx === lookback || price <= currentPrice);

    if (isLocalMin) {
      support.push(currentPrice);
    }
    if (isLocalMax) {
      resistance.push(currentPrice);
    }
  }

  // Return the most significant levels
  return {
    support: [...new Set(support)].sort((a, b) => a - b).slice(-3),
    resistance: [...new Set(resistance)].sort((a, b) => b - a).slice(-3),
  };
}

/**
 * Calculate all technical indicators
 */
export function calculateAllIndicators(prices: number[]): TechnicalIndicators {
  // Validate input
  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    return {
      sma20: 0,
      sma50: 0,
      sma200: 0,
      ema12: 0,
      ema26: 0,
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      support: [],
      resistance: [],
    };
  }

  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const { support, resistance } = findSupportResistance(prices);

  return {
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    rsi,
    macd,
    bollingerBands,
    support: support || [],
    resistance: resistance || [],
  };
}

/**
 * Generate trading signal based on indicators
 */
export function generateSignal(indicators: TechnicalIndicators, currentPrice: number): {
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100
  reasons: string[];
} {
  const reasons: string[] = [];
  let bullishSignals = 0;
  let bearishSignals = 0;

  // RSI Analysis
  if (indicators.rsi < 30) {
    bullishSignals += 2;
    reasons.push('RSI indicates oversold conditions');
  } else if (indicators.rsi > 70) {
    bearishSignals += 2;
    reasons.push('RSI indicates overbought conditions');
  }

  // MACD Analysis
  if (indicators.macd.macd > indicators.macd.signal) {
    bullishSignals++;
    reasons.push('MACD bullish crossover');
  } else {
    bearishSignals++;
    reasons.push('MACD bearish crossover');
  }

  // Moving Average Analysis
  if (currentPrice > indicators.sma20 && indicators.sma20 > indicators.sma50) {
    bullishSignals += 2;
    reasons.push('Price above SMAs with bullish alignment');
  } else if (currentPrice < indicators.sma20 && indicators.sma20 < indicators.sma50) {
    bearishSignals += 2;
    reasons.push('Price below SMAs with bearish alignment');
  }

  // Bollinger Bands
  if (currentPrice < indicators.bollingerBands.lower) {
    bullishSignals++;
    reasons.push('Price below lower Bollinger Band (oversold)');
  } else if (currentPrice > indicators.bollingerBands.upper) {
    bearishSignals++;
    reasons.push('Price above upper Bollinger Band (overbought)');
  }

  const totalSignals = bullishSignals + bearishSignals;
  const strength = totalSignals > 0 ? Math.round((bullishSignals / totalSignals) * 100) : 50;

  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (strength >= 65) {
    action = 'BUY';
  } else if (strength <= 35) {
    action = 'SELL';
  }

  return { action, strength, reasons };
}
