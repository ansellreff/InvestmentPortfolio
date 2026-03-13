/**
 * Yahoo Finance API Client
 * Provides reliable, real-time stock and commodity data
 */

interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  previousClose: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  shortName: string;
  longName: string;
  exchangeName: string;
  marketState: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

interface YahooFinanceChart {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

// Cache configuration
const CACHE_DURATION = 60000; // 1 minute
const priceCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get real-time quote from Yahoo Finance
 */
export async function getQuote(symbol: string): Promise<YahooFinanceQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    if (!response.ok) {
      console.error(`Yahoo Finance API returned ${response.status} for ${symbol}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if Yahoo Finance returned an error
    if (data.chart?.error) {
      console.error(`Yahoo Finance error for ${symbol}:`, data.chart.error);
      return null;
    }

    const result = data.chart?.result?.[0];

    // Sometimes result is null or undefined (symbol not found)
    if (!result) {
      console.error(`No data returned from Yahoo Finance for symbol: ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta || !quote) {
      console.error(`Invalid response format from Yahoo Finance for ${symbol}: missing meta or quote data`);
      return null;
    }

    return {
      symbol: symbol,
      regularMarketPrice: quote.close || 0,
      previousClose: quote.open || 0,
      regularMarketChange: (quote.close || 0) - (quote.open || 0),
      regularMarketChangePercent: ((quote.close || 0) - (quote.open || 0)) / (quote.open || 1) * 100,
      currency: meta.currency,
      shortName: meta.exchangeShortName || symbol,
      longName: meta.longName || symbol,
      exchangeName: meta.exchangeName || '',
      marketState: meta.marketState || 'CLOSED',
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get historical data from Yahoo Finance
 */
export async function getHistoricalData(
  symbol: string,
  days: number = 90
): Promise<YahooFinanceChart | null> {
  try {
    const interval = days <= 30 ? '1d' : days <= 90 ? '1d' : '1wk';
    const range = days <= 30 ? '1mo' : days <= 90 ? '3mo' : '1y';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    if (!response.ok) {
      console.error(`Yahoo Finance API returned ${response.status} for ${symbol} historical data`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if Yahoo Finance returned an error
    if (data.chart?.error) {
      console.error(`Yahoo Finance error for ${symbol}:`, data.chart.error);
      return null;
    }

    const result = data.chart?.result?.[0];

    // Sometimes result is null or undefined (symbol not found)
    if (!result) {
      console.error(`No historical data returned from Yahoo Finance for symbol: ${symbol}`);
      return null;
    }

    return result;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get price with caching
 */
export async function getPrice(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
} | null> {
  const cacheKey = `price_${symbol}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[getYahooPrice] Returning cached data for ${symbol}`);
    return cached.data;
  }

  console.log(`[getYahooPrice] Fetching fresh data for ${symbol}`);
  const quote = await getQuote(symbol);

  if (!quote) {
    console.error(`[getYahooPrice] getQuote returned null for ${symbol}`);
    return null;
  }

  if (quote.regularMarketPrice === 0) {
    console.error(`[getYahooPrice] Quote has zero price for ${symbol}:`, quote);
    return null;
  }

  const data = {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    currency: quote.currency,
    name: quote.shortName || quote.longName || symbol,
  };

  // Only cache successful data
  if (data.price > 0) {
    priceCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log(`[getYahooPrice] Cached successful data for ${symbol}: ${data.price} ${data.currency}`);
  } else {
    console.warn(`[getYahooPrice] Not caching zero-price data for ${symbol}`);
  }

  return data;
}

/**
 * Get historical prices with caching
 */
export async function getHistoricalPrices(
  symbol: string,
  days: number = 90
): Promise<Array<{ date: string; price: number; open?: number; high?: number; low?: number; close?: number; volume?: number }> | null> {
  const cacheKey = `history_${symbol}_${days}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[getYahooHistory] Returning cached data for ${symbol} (${days} days)`);
    return cached.data;
  }

  console.log(`[getYahooHistory] Fetching fresh data for ${symbol} (${days} days)`);
  const chartData = await getHistoricalData(symbol, days);

  // Validate chart data structure
  if (!chartData) {
    console.error(`[getYahooHistory] No chart data returned from Yahoo Finance for ${symbol}`);
    return null;
  }

  console.log(`[getYahooHistory] Chart data keys for ${symbol}:`, Object.keys(chartData));
  console.log(`[getYahooHistory] Has timestamp: ${!!chartData.timestamp}, Is array: ${Array.isArray(chartData.timestamp)}, Length: ${chartData.timestamp?.length || 0}`);
  console.log(`[getYahooHistory] Has close: ${!!chartData.close}, Is array: ${Array.isArray(chartData.close)}, Length: ${chartData.close?.length || 0}`);

  if (!chartData.timestamp || !Array.isArray(chartData.timestamp) || chartData.timestamp.length === 0) {
    console.error(`[getYahooHistory] Invalid or missing timestamp data from Yahoo Finance for ${symbol}`);
    return null;
  }

  if (!chartData.close || !Array.isArray(chartData.close)) {
    console.error(`[getYahooHistory] Invalid or missing close data from Yahoo Finance for ${symbol}`);
    return null;
  }

  const historicalData = chartData.timestamp.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString().split('T')[0],
    price: (chartData.close && chartData.close[index]) || 0,
    open: (chartData.open && chartData.open[index]) || undefined,
    high: (chartData.high && chartData.high[index]) || undefined,
    low: (chartData.low && chartData.low[index]) || undefined,
    close: (chartData.close && chartData.close[index]) || 0,
    volume: (chartData.volume && chartData.volume[index]) || undefined,
  }));

  // Only cache if we have valid data
  const validDataCount = historicalData.filter(d => d.price > 0).length;
  if (validDataCount >= 20) {
    priceCache.set(cacheKey, { data: historicalData, timestamp: Date.now() });
    console.log(`[getYahooHistory] Cached ${historicalData.length} data points for ${symbol} (${validDataCount} valid)`);
  } else {
    console.warn(`[getYahooHistory] Not caching insufficient data for ${symbol}: only ${validDataCount} valid points`);
  }

  return historicalData;
}

/**
 * Search for stocks
 */
export async function searchStocks(query: string): Promise<Array<{
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}>> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    if (!response.ok) {
      console.error(`Yahoo Finance search returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const quotes = data.quotes || [];

    return quotes
      .filter((q: any) => q.isYahooFinance)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname,
        type: q.quoteType?.toUpperCase() || 'EQUITY',
        exchange: q.exchange,
      }))
      .slice(0, 10);
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}
