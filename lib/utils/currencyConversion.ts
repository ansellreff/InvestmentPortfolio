/**
 * Currency conversion utilities with real-time exchange rates
 * Uses open.er-api.com - Free, no API key required, real-time data
 */

// Cache for exchange rates (base: USD)
let exchangeRatesCache: Record<string, number> = {};
let lastFetchTime = 0;
const CACHE_DURATION = 300000; // 5 minutes - refresh more frequently for accuracy

/**
 * Normalize currency code - handle common aliases
 * NTD is an alias for TWD (Taiwan Dollar)
 */
export function normalizeCurrencyCode(currency: string): string {
  const code = currency?.toUpperCase().trim();
  if (code === 'NTD') {
    return 'TWD';
  }
  return code;
}

/**
 * Fetch live exchange rates from free API
 * Uses open.er-api.com - Real-time rates, no API key needed
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Try open.er-api.com first (free, no key, real-time)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.rates && typeof data.rates === 'object') {
        exchangeRatesCache = {
          USD: 1,
          ...data.rates,
          // Alias NTD to TWD for Taiwan Dollar support (API returns TWD)
          NTD: data.rates.TWD,
        };
        lastFetchTime = Date.now();
        console.log('[CurrencyConversion] ✅ Live rates fetched from open.er-api.com:', {
          timestamp: new Date().toISOString(),
          totalCurrencies: Object.keys(exchangeRatesCache).length,
          sampleRates: {
            EUR: exchangeRatesCache.EUR,
            GBP: exchangeRatesCache.GBP,
            JPY: exchangeRatesCache.JPY,
            TWD: exchangeRatesCache.TWD,
            NTD: exchangeRatesCache.NTD,
            IDR: exchangeRatesCache.IDR,
          }
        });
        return exchangeRatesCache;
      }
    }
  } catch (error) {
    console.warn('[CurrencyConversion] ⚠️ Failed to fetch from open.er-api.com:', error);
  }

  // Fallback to exchangerate-api.com
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.rates && typeof data.rates === 'object') {
        exchangeRatesCache = {
          USD: 1,
          ...data.rates,
          // Alias NTD to TWD for Taiwan Dollar support (API returns TWD)
          NTD: data.rates.TWD,
        };
        lastFetchTime = Date.now();
        console.log('[CurrencyConversion] ✅ Rates fetched from exchangerate-api.com (fallback):', {
          timestamp: new Date().toISOString(),
          totalCurrencies: Object.keys(exchangeRatesCache).length,
        });
        return exchangeRatesCache;
      }
    }
  } catch (error) {
    console.warn('[CurrencyConversion] ⚠️ Failed to fetch from exchangerate-api.com:', error);
  }

  // If both APIs fail and we have cached data, use it
  if (Object.keys(exchangeRatesCache).length > 1) {
    console.warn('[CurrencyConversion] ⚠️ Using cached rates (APIs unavailable)');
    return exchangeRatesCache;
  }

  // Last resort - return minimal rates to prevent crashes
  console.error('[CurrencyConversion] ❌ All APIs failed, using emergency fallback');
  return {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CNY: 7.24,
    TWD: 31.50,
    NTD: 31.50, // Alias for TWD
    IDR: 15650,
    SGD: 1.34,
    MYR: 4.72,
    THB: 35.80,
  };
}

/**
 * Get exchange rates (with caching)
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Fetch new rates if cache is expired or empty
  if (Object.keys(exchangeRatesCache).length <= 1 || now - lastFetchTime > CACHE_DURATION) {
    await fetchExchangeRates();
  }

  return exchangeRatesCache;
}

/**
 * Convert amount from one currency to another (async)
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (!amount || !isFinite(amount)) {
    return 0;
  }

  // Normalize currency codes (NTD -> TWD)
  const normalizedFrom = normalizeCurrencyCode(fromCurrency);
  const normalizedTo = normalizeCurrencyCode(toCurrency);

  if (normalizedFrom === normalizedTo) {
    return amount;
  }

  const rates = await getExchangeRates();
  const fromRate = rates[normalizedFrom];
  const toRate = rates[normalizedTo];

  // If rates are not available, try to fetch fresh rates
  if (!fromRate || !toRate || !isFinite(fromRate) || !isFinite(toRate) || fromRate === 0) {
    console.warn(`[CurrencyConversion] Missing rates for ${normalizedFrom} or ${normalizedTo}, fetching fresh data...`);
    await fetchExchangeRates();

    const freshRates = exchangeRatesCache;
    const freshFromRate = freshRates[normalizedFrom];
    const freshToRate = freshRates[normalizedTo];

    if (!freshFromRate || !freshToRate || freshFromRate === 0) {
      console.error(`[CurrencyConversion] ❌ Cannot convert ${normalizedFrom} to ${normalizedTo} - rates unavailable`);
      return amount;
    }

    const amountInUSD = amount / freshFromRate;
    return amountInUSD * freshToRate;
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  const result = amountInUSD * toRate;

  if (!isFinite(result)) {
    console.error(`[CurrencyConversion] ❌ Conversion resulted in invalid value: ${result}`);
    return amount;
  }

  return result;
}

/**
 * Convert currency synchronously using cached rates
 * For immediate display when async is not feasible
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (!amount || !isFinite(amount)) {
    return 0;
  }

  // Normalize currency codes (NTD -> TWD)
  const normalizedFrom = normalizeCurrencyCode(fromCurrency);
  const normalizedTo = normalizeCurrencyCode(toCurrency);

  if (normalizedFrom === normalizedTo) {
    return amount;
  }

  const fromRate = exchangeRatesCache[normalizedFrom];
  const toRate = exchangeRatesCache[normalizedTo];

  // If rates are not available, return original amount
  if (!fromRate || !toRate || !isFinite(fromRate) || !isFinite(toRate) || fromRate === 0) {
    console.warn(`[CurrencyConversion] Missing rates for ${normalizedFrom} to ${normalizedTo}`);
    return amount;
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  const result = amountInUSD * toRate;

  if (!isFinite(result)) {
    console.warn(`[CurrencyConversion] Conversion resulted in invalid value: ${result}`);
    return amount;
  }

  return result;
}

/**
 * Get exchange rate for a currency pair
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  // Normalize currency codes (NTD -> TWD)
  const normalizedFrom = normalizeCurrencyCode(fromCurrency);
  const normalizedTo = normalizeCurrencyCode(toCurrency);

  if (normalizedFrom === normalizedTo) {
    return 1;
  }

  const fromRate = exchangeRatesCache[normalizedFrom];
  const toRate = exchangeRatesCache[normalizedTo];

  if (!fromRate || !toRate || fromRate === 0) {
    console.warn(`[CurrencyConversion] Exchange rate not available for ${normalizedFrom} to ${normalizedTo}`);
    return 1;
  }

  return toRate / fromRate;
}

/**
 * Get last update timestamp
 */
export function getLastUpdateTime(): number {
  return lastFetchTime;
}

/**
 * Check if rates are stale and need refresh
 */
export function areRatesStale(): boolean {
  if (lastFetchTime === 0) return true;
  const age = Date.now() - lastFetchTime;
  return age > CACHE_DURATION;
}
