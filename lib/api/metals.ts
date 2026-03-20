/**
 * Metals Price API
 * Using Yahoo Finance futures for accurate real-time precious metals prices
 * GC=F = Gold Futures, SI=F = Silver Futures, PL=F = Platinum, PA=F = Palladium
 */

interface MetalsPrice {
  price: number;
  currency: string;
  timestamp: number;
}

// Separate cache for each metal to prevent cross-contamination
const metalCache: Record<string, { data: MetalsPrice; expiry: number }> = {};
const CACHE_DURATION = 60000; // 1 minute cache

// Yahoo Finance futures symbols for each metal
const YAHOO_FINANCE_SYMBOLS: Record<string, string> = {
  gold: 'GC=F',
  silver: 'SI=F',
  platinum: 'PL=F',
  palladium: 'PA=F',
};

// Expected price ranges for validation
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  gold: { min: 2000, max: 10000 },
  silver: { min: 10, max: 100 },
  platinum: { min: 500, max: 3000 },
  palladium: { min: 500, max: 3000 },
};

/**
 * Fetch from Yahoo Finance with proper symbol handling
 */
async function fetchFromYahooFinance(yahooSymbol: string, metalType: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  currency: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`[MetalsAPI] Yahoo Finance HTTP ${response.status} for ${yahooSymbol}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      console.warn(`[MetalsAPI] No chart result for ${yahooSymbol}`);
      throw new Error('No chart result');
    }

    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];

    if (!meta || !quote || !quote.close) {
      console.warn(`[MetalsAPI] Invalid data format for ${yahooSymbol}`);
      throw new Error('Invalid data format');
    }

    // Yahoo Finance returns arrays, get the last (most recent) value
    const closeArray = Array.isArray(quote.close) ? quote.close : [quote.close];
    const openArray = Array.isArray(quote.open) ? quote.open : [quote.open];

    // Filter out null values and get the last valid price
    const validClosePrices = closeArray.filter((p: number | null) => p !== null && p !== undefined);
    const validOpenPrices = openArray.filter((p: number | null) => p !== null && p !== undefined);

    if (validClosePrices.length === 0) {
      console.warn(`[MetalsAPI] No valid close prices for ${yahooSymbol}`);
      throw new Error('No valid price data available');
    }

    const price = validClosePrices[validClosePrices.length - 1];
    const openPrice = validOpenPrices.length > 0 ? validOpenPrices[validOpenPrices.length - 1] : price;

    // Use previousClose from meta if available, otherwise fall back to open
    const prevClose = meta.previousClose || openPrice || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    // Validate price is in expected range
    const range = PRICE_RANGES[metalType];
    if (range && (price < range.min || price > range.max)) {
      console.warn(`[MetalsAPI] Price ${price} for ${metalType} outside expected range ${range.min}-${range.max}`);
    }

    console.log(`[MetalsAPI] ✅ ${metalType.toUpperCase()} (${yahooSymbol}): $${price.toFixed(2)} from Yahoo Finance`);

    return {
      price,
      change,
      changePercent,
      currency: meta.currency || 'USD',
    };
  } catch (error) {
    console.warn(`[MetalsAPI] Yahoo Finance failed for ${yahooSymbol} (${metalType}):`, error);
    return null;
  }
}

/**
 * Fetch gold price
 */
async function fetchGoldPrice(): Promise<number | null> {
  // Check cache first
  const cacheKey = 'gold';
  const cached = metalCache[cacheKey];
  if (cached && Date.now() < cached.expiry) {
    console.log(`[MetalsAPI] ✅ Using cached GOLD price: $${cached.data.price}`);
    return cached.data.price;
  }

  // Try Yahoo Finance first
  const yahooData = await fetchFromYahooFinance('GC=F', 'gold');
  if (yahooData && yahooData.price > 1000) {
    // Cache the result
    metalCache[cacheKey] = {
      data: { price: yahooData.price, currency: yahooData.currency, timestamp: Date.now() },
      expiry: Date.now() + CACHE_DURATION,
    };
    return yahooData.price;
  }

  // Fallback to alternative sources
  const sources = [
    async () => {
      try {
        const response = await fetch('https://api.metals.live/v1/spot/gold', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (response.ok) {
          const result = await response.json();
          const price = result.price || result.ask;
          if (price && price > 1000) {
            console.log(`[MetalsAPI] Gold from metals.live: $${price}`);
            return price;
          }
        }
      } catch (error) {
        console.warn('[MetalsAPI] metals.live failed:', error);
      }
      return null;
    },
    async () => {
      try {
        const response = await fetch('https://financialmodelingprep.com/api/v3/quote/XAUUSD?apikey=demo', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (response.ok) {
          const result = await response.json();
          if (result && result[0] && result[0].price > 1000) {
            console.log(`[MetalsAPI] Gold from FMP: $${result[0].price}`);
            return result[0].price;
          }
        }
      } catch (error) {
        console.warn('[MetalsAPI] FMP failed:', error);
      }
      return null;
    },
  ];

  for (const source of sources) {
    try {
      const price = await source();
      if (price && price > 1000) {
        // Cache the result
        metalCache[cacheKey] = {
          data: { price, currency: 'USD', timestamp: Date.now() },
          expiry: Date.now() + CACHE_DURATION,
        };
        return price;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Fetch silver price
 */
async function fetchSilverPrice(): Promise<number | null> {
  // Check cache first
  const cacheKey = 'silver';
  const cached = metalCache[cacheKey];
  if (cached && Date.now() < cached.expiry) {
    console.log(`[MetalsAPI] ✅ Using cached SILVER price: $${cached.data.price}`);
    return cached.data.price;
  }

  // Try Yahoo Finance first
  const yahooData = await fetchFromYahooFinance('SI=F', 'silver');
  if (yahooData && yahooData.price > 10) {
    // Cache the result
    metalCache[cacheKey] = {
      data: { price: yahooData.price, currency: yahooData.currency, timestamp: Date.now() },
      expiry: Date.now() + CACHE_DURATION,
    };
    return yahooData.price;
  }

  // Fallback
  try {
    const response = await fetch('https://api.metals.live/v1/spot/silver', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (response.ok) {
      const result = await response.json();
      const price = result.price || result.ask;
      if (price && price > 10) {
        console.log(`[MetalsAPI] Silver from metals.live: $${price}`);
        // Cache the result
        metalCache[cacheKey] = {
          data: { price, currency: 'USD', timestamp: Date.now() },
          expiry: Date.now() + CACHE_DURATION,
        };
        return price;
      }
    }
  } catch (error) {
    console.warn('[MetalsAPI] Silver metals.live failed:', error);
  }

  return null;
}

/**
 * Fetch platinum price
 */
async function fetchPlatinumPrice(): Promise<number | null> {
  // Check cache first
  const cacheKey = 'platinum';
  const cached = metalCache[cacheKey];
  if (cached && Date.now() < cached.expiry) {
    console.log(`[MetalsAPI] ✅ Using cached PLATINUM price: $${cached.data.price}`);
    return cached.data.price;
  }

  // Try Yahoo Finance first
  const yahooData = await fetchFromYahooFinance('PL=F', 'platinum');
  if (yahooData && yahooData.price > 500) {
    // Cache the result
    metalCache[cacheKey] = {
      data: { price: yahooData.price, currency: yahooData.currency, timestamp: Date.now() },
      expiry: Date.now() + CACHE_DURATION,
    };
    return yahooData.price;
  }

  // Fallback
  try {
    const response = await fetch('https://api.metals.live/v1/spot/platinum', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (response.ok) {
      const result = await response.json();
      const price = result.price || result.ask;
      if (price && price > 500) {
        console.log(`[MetalsAPI] Platinum from metals.live: $${price}`);
        // Cache the result
        metalCache[cacheKey] = {
          data: { price, currency: 'USD', timestamp: Date.now() },
          expiry: Date.now() + CACHE_DURATION,
        };
        return price;
      }
    }
  } catch (error) {
    console.warn('[MetalsAPI] Platinum metals.live failed:', error);
  }

  return null;
}

/**
 * Fetch palladium price
 */
async function fetchPalladiumPrice(): Promise<number | null> {
  // Check cache first
  const cacheKey = 'palladium';
  const cached = metalCache[cacheKey];
  if (cached && Date.now() < cached.expiry) {
    console.log(`[MetalsAPI] ✅ Using cached PALLADIUM price: $${cached.data.price}`);
    return cached.data.price;
  }

  // Try Yahoo Finance first
  const yahooData = await fetchFromYahooFinance('PA=F', 'palladium');
  if (yahooData && yahooData.price > 500) {
    // Cache the result
    metalCache[cacheKey] = {
      data: { price: yahooData.price, currency: yahooData.currency, timestamp: Date.now() },
      expiry: Date.now() + CACHE_DURATION,
    };
    return yahooData.price;
  }

  // Fallback
  try {
    const response = await fetch('https://api.metals.live/v1/spot/palladium', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (response.ok) {
      const result = await response.json();
      const price = result.price || result.ask;
      if (price && price > 500) {
        console.log(`[MetalsAPI] Palladium from metals.live: $${price}`);
        // Cache the result
        metalCache[cacheKey] = {
          data: { price, currency: 'USD', timestamp: Date.now() },
          expiry: Date.now() + CACHE_DURATION,
        };
        return price;
      }
    }
  } catch (error) {
    console.warn('[MetalsAPI] Palladium metals.live failed:', error);
  }

  return null;
}

/**
 * Get metal price with caching
 */
export async function getMetalPrice(metal: 'gold' | 'silver' | 'platinum' | 'palladium'): Promise<MetalsPrice | null> {
  let price: number | null = null;

  // Fetch new price based on metal type
  switch (metal) {
    case 'gold':
      price = await fetchGoldPrice();
      break;
    case 'silver':
      price = await fetchSilverPrice();
      break;
    case 'platinum':
      price = await fetchPlatinumPrice();
      break;
    case 'palladium':
      price = await fetchPalladiumPrice();
      break;
  }

  if (!price) {
    console.warn(`[MetalsAPI] ⚠️ All sources failed for ${metal}, using fallback`);
    // Fallback prices
    const fallbackPrices: Record<string, number> = {
      gold: 4500.00,
      silver: 32.50,
      platinum: 980.00,
      palladium: 1050.00,
    };
    price = fallbackPrices[metal] || 0;
  }

  return {
    price,
    currency: 'USD',
    timestamp: Date.now(),
  };
}

/**
 * Get metal price with change data
 */
export async function getMetalPriceWithChange(metal: 'gold' | 'silver' | 'platinum' | 'palladium'): Promise<{
  price: number;
  change: number;
  changePercent: number;
  currency: string;
} | null> {
  // Try Yahoo Finance first for accurate price + change data
  const yahooSymbol = YAHOO_FINANCE_SYMBOLS[metal];
  const yahooData = await fetchFromYahooFinance(yahooSymbol, metal);

  if (yahooData) {
    return {
      price: yahooData.price,
      change: yahooData.change,
      changePercent: yahooData.changePercent,
      currency: yahooData.currency,
    };
  }

  // Fallback to basic price fetch
  const result = await getMetalPrice(metal);
  if (!result) return null;

  return {
    price: result.price,
    change: 0,
    changePercent: 0,
    currency: result.currency,
  };
}

/**
 * Get historical data for metals from Yahoo Finance
 */
export async function getMetalHistorical(
  metal: 'gold' | 'silver' | 'platinum' | 'palladium',
  days: number = 90
): Promise<Array<{
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> | null> {
  const yahooSymbol = YAHOO_FINANCE_SYMBOLS[metal];
  const range = days <= 30 ? '1mo' : days <= 90 ? '3mo' : '1y';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${range}`;

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
    const historical: Array<{
      date: string;
      price: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    for (let i = 0; i < result.timestamp.length; i++) {
      const close = quote.close?.[i];
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];

      if (close !== null && close !== undefined) {
        historical.push({
          date: new Date(result.timestamp[i] * 1000).toISOString().split('T')[0],
          price: close,
          open: open || close,
          high: high || close,
          low: low || close,
          close: close,
          volume: quote.volume?.[i] || 0,
        });
      }
    }

    console.log(`[MetalsAPI] ✅ Fetched ${historical.length} historical data points for ${metal}`);
    return historical;
  } catch (error) {
    console.error(`[MetalsAPI] Historical fetch failed for ${metal}:`, error);
    return null;
  }
}
