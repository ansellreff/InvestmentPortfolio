/**
 * Finnhub.io API Integration
 * Provides access to 90,000+ US stocks, ETFs, and indices
 * Free tier: 60 calls/minute
 *
 * Documentation: https://finnhub.io/docs/api
 */

const FINNHUB_API_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

export interface FinnhubSearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'ETF' | 'INDEX' | 'MUTUAL_FUND';
  exchange: string;
  country: string;
  currency?: string;
}

export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubSymbol {
  symbol: string;
  description: string;
  type: string;
  mic: string; // Market Identifier Code
  displaySymbol: string;
  figi: string; // OpenFIGI identifier
  currency: string;
}

/**
 * Search for stocks, ETFs, indices, and more
 * @param query - Search term (symbol or company name)
 * @returns Array of search results
 */
export async function searchSecurities(query: string): Promise<FinnhubSearchResult[]> {
  if (!FINNHUB_API_KEY) {
    console.warn('[Finnhub] No API key configured');
    return [];
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Finnhub results to our format
    return (data.result || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      type: mapFinnhubType(item.type),
      exchange: extractExchange(item.symbol) || item.mic || 'US',
      country: 'US',
    }));
  } catch (error) {
    console.error('[Finnhub] Search error:', error);
    return [];
  }
}

/**
 * Get real-time quote for a symbol
 * @param symbol - Stock symbol (e.g., 'AAPL', 'MSFT')
 * @returns Quote data or null
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  if (!FINNHUB_API_KEY) {
    console.warn('[Finnhub] No API key configured');
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if we got valid data
    if (data.c === 0 && !data.o) {
      return null;
    }

    return data as FinnhubQuote;
  } catch (error) {
    console.error(`[Finnhub] Quote error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get company basic financials
 * @param symbol - Stock symbol
 * @param metricType - Metrics type ('all', 'price', 'valuation', etc.)
 * @returns Financial metrics or null
 */
export async function getCompanyBasicFinancials(
  symbol: string,
  metricType: 'all' | 'price' | 'valuation' | 'growth' | 'margin' = 'all'
): Promise<Record<string, any> | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/stock/metric?symbol=${symbol}&metric=${metricType}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.metric || null;
  } catch (error) {
    console.error(`[Finnhub] Financials error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get company profile
 * @param symbol - Stock symbol
 * @returns Company profile or null
 */
export async function getCompanyProfile(symbol: string): Promise<{
  name: string;
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  phone: string;
  weburl: string;
  logo: string;
  industry: string;
  sector: string;
} | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Finnhub] Profile error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get list of available symbols for an exchange
 * @param exchange - Exchange code (e.g., 'US', 'NYSE', 'NASDAQ')
 * @returns Array of symbols
 */
export async function getExchangeSymbols(exchange: string = 'US'): Promise<FinnhubSymbol[]> {
  if (!FINNHUB_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/stock/symbol?exchange=${exchange}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(`[Finnhub] Symbols error for ${exchange}:`, error);
    return [];
  }
}

/**
 * Get market news
 * @param category - News category ('general', 'forex', 'crypto', 'merger')
 * @param minId - Use to fetch older news
 * @returns Array of news articles
 */
export async function getMarketNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general',
  minId = 0
): Promise<Array<{
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}> | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const minIdParam = minId > 0 ? `&minId=${minId}` : '';
    const response = await fetch(
      `${FINNHUB_API_BASE}/news?category=${category}${minIdParam}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Finnhub] News error:', error);
    return null;
  }
}

/**
 * Get company news
 * @param symbol - Stock symbol
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @returns Array of news articles
 */
export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<Array<{
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}> | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Finnhub] Company news error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get peers of a company
 * @param symbol - Stock symbol
 * @returns Array of peer symbols
 */
export async function getCompanyPeers(symbol: string): Promise<string[] | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Finnhub] Peers error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock candles (OHLC data)
 * @param symbol - Stock symbol
 * @param resolution - Time resolution (1, 5, 15, 30, 60, D, W, M)
 * @param from - Unix timestamp (seconds)
 * @param to - Unix timestamp (seconds)
 * @returns Candle data
 */
export async function getStockCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<{
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status ('ok' or 'no_data')
  t: number[]; // Timestamps
  v: number[]; // Volumes
} | null> {
  if (!FINNHUB_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_API_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.s === 'no_data') {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`[Finnhub] Candles error for ${symbol}:`, error);
    return null;
  }
}

// Helper functions

function mapFinnhubType(type: string): FinnhubSearchResult['type'] {
  const typeMap: Record<string, FinnhubSearchResult['type']> = {
    'Common Stock': 'STOCK',
    'ETF': 'ETF',
    'ETN': 'ETF',
    'REIT': 'STOCK',
    'ADR': 'STOCK',
    'UNIT': 'STOCK',
    'RIGHT': 'STOCK',
    'WARRANT': 'STOCK',
    'INDEX': 'INDEX',
    'Mutual Fund': 'MUTUAL_FUND',
    'Fund': 'MUTUAL_FUND',
  };

  return typeMap[type] || 'STOCK';
}

function extractExchange(symbol: string): string | null {
  // Extract exchange from symbol if present (e.g., 'AAPL.US' -> 'US')
  const parts = symbol.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  // Common US exchanges
  const usExchanges = ['NYSE', 'NASDAQ', 'AMEX'];

  // Try to determine from symbol format
  if (symbol.includes('-') || symbol.includes('_')) {
    return 'US';
  }

  return null;
}

/**
 * Convert Finnhub quote to standard price format
 */
export function quoteToPriceData(quote: FinnhubQuote, symbol: string, name?: string) {
  return {
    symbol,
    name: name || symbol,
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    currency: 'USD',
    timestamp: new Date(quote.t * 1000).toISOString(),
    source: 'Finnhub',
  };
}

/**
 * Batch get quotes for multiple symbols
 * @param symbols - Array of symbols
 * @returns Map of symbol to quote data
 */
export async function getBatchQuotes(
  symbols: string[]
): Promise<Map<string, FinnhubQuote | null>> {
  if (!FINNHUB_API_KEY) {
    return new Map(symbols.map(s => [s, null]));
  }

  const results = new Map<string, FinnhubQuote | null>();

  await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await getQuote(symbol);
      results.set(symbol, quote);
    })
  );

  return results;
}

/**
 * Get popular US stocks (commonly traded)
 */
export const POPULAR_US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'MA', name: 'Mastercard Incorporated' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
];

/**
 * Get popular ETFs
 */
export const POPULAR_ETFS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  { symbol: 'VWO', name: 'Vanguard Emerging Markets Stock Index Fund' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund' },
];

/**
 * Get popular indices
 */
export const POPULAR_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
  { symbol: '^IXIC', name: 'NASDAQ Composite' },
  { symbol: '^RUT', name: 'Russell 2000' },
  { symbol: '^VIX', name: 'CBOE Volatility Index' },
];
