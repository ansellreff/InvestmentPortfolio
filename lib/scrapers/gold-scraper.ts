import axios from 'axios';
import * as cheerio from 'cheerio';

export interface GoldPrice {
  price: number;
  currency: string;
  source: string;
  timestamp: Date;
}

/**
 * Scrape gold price from Investing.com
 */
async function scrapeInvestingDotCom(): Promise<number | null> {
  try {
    const response = await axios.get('https://www.investing.com/commodities/gold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const priceText = $('#last_last').text().replace(/,/g, '');
    const price = parseFloat(priceText);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error('Error scraping Investing.com:', error);
    return null;
  }
}

/**
 * Scrape gold price from Kitco.com
 */
async function scrapeKitco(): Promise<number | null> {
  try {
    const response = await axios.get('https://www.kitco.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    // Kitco displays price in various elements, looking for bid price
    const priceElement = $('.spot-price-bid').first();
    const priceText = priceElement.text().replace(/[^0-9.]/g, '');
    const price = parseFloat(priceText);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error('Error scraping Kitco:', error);
    return null;
  }
}

/**
 * Scrape gold price from MarketWatch
 */
async function scrapeMarketWatch(): Promise<number | null> {
  try {
    // MarketWatch gold futures GC=F
    const response = await axios.get('https://www.marketwatch.com/investing/future/gc00', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const priceElement = $('.value').first();
    const priceText = priceElement.text().replace(/,/g, '');
    const price = parseFloat(priceText);
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error('Error scraping MarketWatch:', error);
    return null;
  }
}

/**
 * Get gold price from Yahoo Finance via API
 */
async function getYahooFinanceGold(): Promise<number | null> {
  try {
    const response = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return response.data.chart.result[0].meta.regularMarketPrice;
    }
    return null;
  } catch (error) {
    console.error('Error getting Yahoo Finance gold price:', error);
    return null;
  }
}

/**
 * Get gold price from Gold.org (LBMA)
 * Note: LBMA provides historical data, we'll use their gold price table
 */
async function getGoldOrgLBMA(): Promise<number | null> {
  try {
    const response = await axios.get('https://www.gold.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    // Try to find gold price on their homepage
    const priceElement = $('.gold-price, [class*="gold"][class*="price"]').first();
    if (priceElement.length) {
      const priceText = priceElement.text().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceText);
      return isNaN(price) ? null : price;
    }
    return null;
  } catch (error) {
    console.error('Error getting Gold.org price:', error);
    return null;
  }
}

/**
 * Main function to fetch and average gold prices from all sources
 */
export async function fetchGoldPrices(): Promise<{
  prices: GoldPrice[];
  average: number | null;
  sources: string[];
}> {
  const sources = [
    { name: 'Investing.com', fn: scrapeInvestingDotCom },
    { name: 'Kitco', fn: scrapeKitco },
    { name: 'MarketWatch', fn: scrapeMarketWatch },
    { name: 'Yahoo Finance', fn: getYahooFinanceGold },
    { name: 'Gold.org (LBMA)', fn: getGoldOrgLBMA },
  ];

  const prices: GoldPrice[] = [];
  const validPrices: number[] = [];
  const successfulSources: string[] = [];

  // Fetch from all sources in parallel
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const price = await source.fn();
      return { source: source.name, price };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.price !== null) {
      prices.push({
        price: result.value.price,
        currency: 'USD',
        source: result.value.source,
        timestamp: new Date(),
      });
      validPrices.push(result.value.price);
      successfulSources.push(result.value.source);
    }
  }

  // Calculate average
  const average =
    validPrices.length > 0
      ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
      : null;

  return {
    prices,
    average,
    sources: successfulSources,
  };
}

/**
 * Fetch gold price for API response
 */
export async function getGoldPrice() {
  const result = await fetchGoldPrices();

  if (result.average === null) {
    throw new Error('Failed to fetch gold prices from any source');
  }

  return {
    price: result.average,
    currency: 'USD',
    sources: result.sources,
    individualPrices: result.prices,
    timestamp: new Date().toISOString(),
  };
}
