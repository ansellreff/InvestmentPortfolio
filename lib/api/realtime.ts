/**
 * Real-Time Stock Data Provider
 * Professional API client for live market data
 * Supports: US Stocks, Indonesian Stocks, Gold, Forex
 */

interface RealtimeQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
}

interface RealtimeHistorical {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Exchange rate cache (refreshed hourly)
let exchangeRates: Record<string, number> = {
  USD: 1,
  IDR: 16250,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
};

let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetch real-time quote from multiple professional sources
 */
async function fetchRealtimeQuote(symbol: string): Promise<RealtimeQuote | null> {
  const upperSymbol = symbol.toUpperCase();

  // Try multiple sources in order of reliability
  const sources = [
    { fn: fetchFromYahooFinance, name: 'Yahoo Finance' },
    { fn: fetchFromTwelveData, name: 'Twelve Data' },
    { fn: fetchFromMarketStack, name: 'MarketStack' },
  ];

  for (const source of sources) {
    try {
      const quote = await source.fn(upperSymbol);
      if (quote && quote.price > 0) {
        console.log(`[RealtimeData] ✅ ${upperSymbol}: $${quote.price} ${quote.currency} from ${source.name}`);
        return quote;
      }
    } catch (error) {
      console.warn(`[RealtimeData] ⚠️ ${source.name} failed for ${upperSymbol}:`, error);
      continue;
    }
  }

  console.error(`[RealtimeData] ❌ All sources failed for ${upperSymbol}`);
  return null;
}

/**
 * Source 1: Yahoo Finance (most reliable, no API key needed)
 */
async function fetchFromYahooFinance(symbol: string): Promise<RealtimeQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];

    if (!meta || !quote || !quote.close) {
      throw new Error('Invalid data format');
    }

    // Yahoo Finance returns arrays, get the last (most recent) value
    const closeArray = Array.isArray(quote.close) ? quote.close : [quote.close];
    const openArray = Array.isArray(quote.open) ? quote.open : [quote.open];

    // Filter out null values and get the last valid price
    const validClosePrices = closeArray.filter((p: number | null) => p !== null && p !== undefined);
    const validOpenPrices = openArray.filter((p: number | null) => p !== null && p !== undefined);

    if (validClosePrices.length === 0) {
      throw new Error('No valid price data available');
    }

    const price = validClosePrices[validClosePrices.length - 1];
    const openPrice = validOpenPrices.length > 0 ? validOpenPrices[validOpenPrices.length - 1] : price;

    // Use previousClose from meta if available, otherwise fall back to open
    const prevClose = meta.previousClose || openPrice || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price,
      change,
      changePercent,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || 'NYSE',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Source 2: Twelve Data (real-time, free API available)
 */
async function fetchFromTwelveData(symbol: string): Promise<RealtimeQuote | null> {
  try {
    const API_KEY = process.env.TWELVE_DATA_API_KEY || 'demo';
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.status !== 'ok' || !data.data) {
      throw new Error(data.message || 'Invalid response');
    }

    const quote = data.data;
    return {
      symbol: quote.symbol,
      name: quote.name || symbol,
      price: parseFloat(quote.price),
      change: parseFloat(quote.change),
      changePercent: parseFloat(quote.percent_change),
      currency: quote.currency || 'USD',
      exchange: quote.exchange || 'NASDAQ',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Source 3: MarketStack (real-time, free API available)
 */
async function fetchFromMarketStack(symbol: string): Promise<RealtimeQuote | null> {
  try {
    const API_KEY = process.env.MARKETSTACK_API_KEY || 'demo';
    const url = `http://api.marketstack.com/v1/tickers/${symbol}/intraday?access_key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.error || !data.data) {
      throw new Error(data.error?.message || 'Invalid response');
    }

    const intraday = data.data;
    const latest = intraday[intraday.length - 1];

    return {
      symbol,
      name: intraday.name || symbol,
      price: parseFloat(latest.close),
      change: 0, // MarketStack doesn't provide change
      changePercent: 0,
      currency: intraday.currency || 'USD',
      exchange: intraday.stock_exchange || 'NASDAQ',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Fetch historical data from Yahoo Finance
 */
async function fetchHistoricalData(symbol: string, days: number = 90): Promise<RealtimeHistorical[] | null> {
  try {
    const range = days <= 30 ? '1mo' : days <= 90 ? '3mo' : '1y';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error('Invalid data format');
    }

    const quote = result.indicators.quote[0];
    const historical: RealtimeHistorical[] = [];

    for (let i = 0; i < result.timestamp.length; i++) {
      historical.push({
        date: new Date(result.timestamp[i] * 1000).toISOString().split('T')[0],
        price: quote.close?.[i] || 0,
        open: quote.open?.[i] || 0,
        high: quote.high?.[i] || 0,
        low: quote.low?.[i] || 0,
        close: quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0,
      });
    }

    return historical;
  } catch (error) {
    console.error(`[RealtimeData] Historical fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get real-time quote (main export)
 */
export async function getQuote(symbol: string): Promise<RealtimeQuote | null> {
  return await fetchRealtimeQuote(symbol);
}

/**
 * Get historical data (main export)
 */
export async function getHistoricalPrices(
  symbol: string,
  days: number = 90
): Promise<RealtimeHistorical[] | null> {
  return await fetchHistoricalData(symbol, days);
}

/**
 * Get price (alias for getQuote)
 */
export async function getPrice(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
} | null> {
  const quote = await getQuote(symbol);
  if (!quote) return null;

  return {
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    currency: quote.currency,
    name: quote.name,
  };
}

/**
 * Search for stocks (Yahoo Finance search)
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const quotes = data.quotes || [];

    return quotes
      .filter((q: any) => q.isYahooFinance)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname,
        type: (q.quoteType || 'EQUITY').toUpperCase(),
        exchange: q.exchange || 'NASDAQ',
      }))
      .slice(0, 10);
  } catch (error) {
    console.error('[RealtimeData] Search failed:', error);
    return [];
  }
}

/**
 * Get popular Indonesian stocks
 */
export async function getPopularStocks(): Promise<Array<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}>> {
  const symbols = ['BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'ASII.JK', 'UNVR.JK'];
  const results = [];

  for (const symbol of symbols) {
    const quote = await getPrice(symbol);
    if (quote) {
      results.push({
        symbol,
        ...quote,
      });
    }
  }

  return results;
}

/**
 * Update exchange rates (for currency conversion)
 */
export async function updateExchangeRates(): Promise<void> {
  try {
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      exchangeRates = {
        USD: 1,
        ...data.rates,
      };
      lastRateUpdate = Date.now();
      console.log('[RealtimeData] Exchange rates updated:', exchangeRates);
    }
  } catch (error) {
    console.warn('[RealtimeData] Failed to update exchange rates');
  }
}

/**
 * Get exchange rates
 */
export function getExchangeRates(): Record<string, number> {
  // Update rates if cache is stale
  if (Date.now() - lastRateUpdate > RATE_CACHE_DURATION) {
    updateExchangeRates();
  }
  return exchangeRates;
}
