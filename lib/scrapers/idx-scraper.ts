import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '@/lib/utils/logger';

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  source: string;
  timestamp: Date;
}

export interface IDXStock {
  symbol: string;
  name: string;
}

// Popular Indonesian stocks for search
export const POPULAR_INDONESIAN_STOCKS: IDXStock[] = [
  { symbol: 'BBCA.JK', name: 'Bank Central Asia' },
  { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia' },
  { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia' },
  { symbol: 'BMRI.JK', name: 'Bank Mandiri' },
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia' },
  { symbol: 'UNVR.JK', name: 'Unilever Indonesia' },
  { symbol: 'ASII.JK', name: 'Astra International' },
  { symbol: 'ICBP.JK', name: 'Indofood CBP' },
  { symbol: 'INDF.JK', name: 'Indofood Sukses Makmur' },
  { symbol: 'GGRM.JK', name: 'Gudang Garam' },
  { symbol: 'ADRO.JK', name: 'Adaro Energy' },
  { symbol: 'PGAS.JK', name: 'Perusahaan Gas Negara' },
  { symbol: 'JSMR.JK', name: 'Jasa Marga' },
  { symbol: 'EXCL.JK', name: 'XL Axiata' },
  { symbol: 'ISAT.JK', name: 'Indosat Ooredoo' },
];

// Extended IDX stocks (top 100 by market cap)
const EXTENDED_IDX_STOCKS: IDXStock[] = [
  { symbol: 'BBCA.JK', name: 'Bank Central Asia Tbk' },
  { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia (Persero) Tbk' },
  { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia (Persero) Tbk' },
  { symbol: 'BMRI.JK', name: 'Bank Mandiri (Persero) Tbk' },
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia (Persero) Tbk' },
  { symbol: 'ASII.JK', name: 'Astra International Tbk' },
  { symbol: 'UNVR.JK', name: 'Unilever Indonesia Tbk' },
  { symbol: 'INDF.JK', name: 'Indofood Sukses Makmur Tbk' },
  { symbol: 'ICBP.JK', name: 'Indofood CBP Sukses Makmur Tbk' },
  { symbol: 'GGRM.JK', name: 'Gudang Garam Tbk' },
  { symbol: 'ADRO.JK', name: 'Adaro Energy Indonesia Tbk' },
  { symbol: 'ITMG.JK', name: 'Adaro Energy Indonesia Tbk' },
  { symbol: 'PGAS.JK', name: 'Perusahaan Gas Negara Tbk' },
  { symbol: 'JSMR.JK', name: 'Jasa Marga (Persero) Tbk' },
  { symbol: 'EXCL.JK', name: 'XL Axiata Tbk' },
  { symbol: 'ISAT.JK', name: 'Indosat Ooredoo Hutchison Tbk' },
  { symbol: 'FREN.JK', name: 'Smartfren Telecom Tbk' },
  { symbol: 'BRPT.JK', name: 'Barito Pacific Tbk' },
  { symbol: 'TPIA.JK', name: 'Chandra Asri Petrochemical Tbk' },
  { symbol: 'KLBF.JK', name: 'Kalbe Farma Tbk' },
  { symbol: 'MRAT.JK', name: 'Metropolitan Land Tbk' },
  { symbol: 'UNTR.JK', name: 'United Tractors Tbk' },
  { symbol: 'ANTM.JK', name: 'Aneka Tambang Tbk' },
  { symbol: 'PTBA.JK', name: 'Bukit Asam Tbk' },
  { symbol: 'MDKA.JK', name: 'Merdeka Copper Gold Tbk' },
  { symbol: 'TINS.JK', name: 'Timah Tbk' },
  { symbol: 'SMGR.JK', name: 'Semen Indonesia Tbk' },
  { symbol: 'INTP.JK', name: 'Indocement Tunggal Prakasa Tbk' },
  { symbol: 'WIKA.JK', name: 'Wijaya Karya (Persero) Tbk' },
  { symbol: 'PTPP.JK', name: 'PP (Persero) Tbk' },
  { symbol: 'ADHI.JK', name: 'Adhi Karya (Persero) Tbk' },
  { symbol: 'WSKT.JK', name: 'Waskita Karya (Persero) Tbk' },
  { symbol: 'PTRO.JK', name: 'Petrosea Tbk' },
  { symbol: 'MEDC.JK', name: 'Medco Energi International Tbk' },
  { symbol: 'CORE.JK', name: 'Malaysia Airports Holdings Berhad' },
  { symbol: 'HRUM.JK', name: 'Mitrabahtera Segara Sejati Tbk' },
  { symbol: 'DOID.JK', name: 'Delta Dunia Makmur Tbk' },
  { symbol: 'BIMA.JK', name: 'Primarinda Asia Pratama Tbk' },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia Tbk' },
  { symbol: 'BUKA.JK', name: 'Bukalapak.com Tbk' },
  { symbol: 'TCID.JK', name: 'MNC Asia Holding Tbk' },
  { symbol: 'MNCN.JK', name: 'Media Nusantara Citra Tbk' },
  { symbol: 'BMTR.JK', name: 'Global Mediacom Tbk' },
  { symbol: 'DMAS.JK', name: 'PT Pondasi Perkasa Utama Tbk' },
  { symbol: 'LINK.JK', name: 'Link Net Tbk' },
  { symbol: 'BLTA.JK', name: 'PT Indo Straits Tbk' },
  { symbol: 'CMPP.JK', name: 'PT Trisigma Adhipratama Tbk' },
  { symbol: 'KOPI.JK', name: 'PT Kapal Api Global Tbk' },
  { symbol: 'MLPL.JK', name: 'PT Multipolar Technology Tbk' },
  { symbol: 'SQMI.JK', name: 'PT Solusi Quantra Integrasi Tbk' },
  { symbol: 'DPNS.JK', name: 'PT Danareksa (Persero) Tbk' },
  { symbol: 'EDGE.JK', name: 'PT Edge Technology Indonesia Tbk' },
  { symbol: 'FISH.JK', name: 'PT First Source Tbk' },
  { symbol: 'GPRA.JK', name: 'PT Moka Asia Tbk' },
  { symbol: 'YES.JK', name: 'PT Youtoo Asia Tbk' },
  { symbol: 'AKRA.JK', name: 'AKR Corporindo Tbk' },
  { symbol: 'KPIG.JK', name: 'PT Chitose Internasional Tbk' },
  { symbol: 'MTLA.JK', name: 'PT Mercial Indonesia Tbk' },
  { symbol: 'SULI.JK', name: 'PT Sulindo Multi Grahita Tbk' },
  { symbol: 'MYOR.JK', name: 'PT Mayora Indah Tbk' },
  { symbol: 'ULTJ.JK', name: 'PT Ultra Jaya Milk Industry Tbk' },
  { symbol: 'STTP.JK', name: 'PT Siantar Top Tbk' },
  { symbol: 'SKLT.JK', name: 'PT Sekar Laut Tbk' },
  { symbol: 'AISA.JK', name: 'PT Tiga Pilar Sejahtera Food Tbk' },
  { symbol: 'DSTG.JK', name: 'PT Dua Sisi Tbk' },
  { symbol: 'ICBP.JK', name: 'PT Indofood CBP Sukses Makmur Tbk' },
  { symbol: 'INDF.JK', name: 'PT Indofood Sukses Makmur Tbk' },
  { symbol: 'SIMP.JK', name: 'PT Salim Ivomas Pratama Tbk' },
  { symbol: 'LSIP.JK', name: 'PT PP London Sumatra Indonesia Tbk' },
  { symbol: 'SSMS.JK', name: 'PT Sawit Sumbermas Sarana Tbk' },
  { symbol: 'TBLA.JK', name: 'PT Tunas Baru Lampung Tbk' },
  { symbol: 'MSKY.JK', name: 'PT Megasari Makmur Tbk' },
  { symbol: 'GZCO.JK', name: 'PT Great Giany City Tbk' },
  { symbol: 'HMSP.JK', name: 'PT HM Sampoerna Tbk' },
  { symbol: 'GJTL.JK', name: 'PT Gajah Tunggal Tbk' },
  { symbol: 'Bridgestone.JK', name: 'PT Bridgestone Tire Indonesia Tbk' },
  { symbol: 'ALDO.JK', name: 'PT Alumindo Light Metal Industry Tbk' },
  { symbol: 'AMFG.JK', name: 'PT Astra Graphia Tbk' },
  { symbol: 'AUTO.JK', name: 'PT Astra Otoparts Tbk' },
  { symbol: 'BABA.JK', name: 'PT Baba Rafi Indonesia Tbk' },
  { symbol: 'BARM.JK', name: 'PT Bara Mitra Kencana Tbk' },
  { symbol: 'BEEF.JK', name: 'PT Jamparing Berkah Utama Tbk' },
  { symbol: 'BIMA.JK', name: 'PT Primarinda Asia Pratama Tbk' },
  { symbol: 'BIRD.JK', name: 'PT Blue Bird Tbk' },
  { symbol: 'BLTZ.JK', name: 'PT Bliss Propertindo Tbk' },
  { symbol: 'BNGA.JK', name: 'PT Bank CIMB Niaga Tbk' },
  { symbol: 'BNBR.JK', name: 'PT Bakrie & Brothers Tbk' },
  { symbol: 'BNII.JK', name: 'PT Bank Maybank Indonesia Tbk' },
  { symbol: 'BPKA.JK', name: 'PT Bakrie Sumatera Plantations Tbk' },
  { symbol: 'BRMS.JK', name: 'PT Bumi Resources Minerals Tbk' },
  { symbol: 'BRPT.JK', name: 'PT Barito Pacific Tbk' },
  { symbol: 'BSSR.JK', name: 'PT Baramulti Suksessarana Tbk' },
  { symbol: 'BTON.JK', name: 'PT Wijaya Karya Beton Tbk' },
  { symbol: 'BUDI.JK', name: 'PT Budidharma Duta Indonesia Tbk' },
  { symbol: 'BUKA.JK', name: 'PT Bukalapak.com Tbk' },
  { symbol: 'BUMI.JK', name: 'PT Bumi Resources Tbk' },
  { symbol: 'BUNI.JK', name: 'PT Visi Telekomunikasi Infrastruktur Tbk' },
  { symbol: 'CAN.JK', name: 'PT Pardic Jayanusa Tbk' },
];

// In-memory cache for dynamic search results
let idxStocksCache: IDXStock[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get Indonesian stock price from Yahoo Finance
 */
async function getYahooFinanceStock(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
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
    logger.error('[IDXScraper]', `Error getting Yahoo Finance stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get Indonesian stock price from Investing.com
 */
async function scrapeInvestingDotComStock(symbol: string): Promise<number | null> {
  try {
    // Investing.com uses different symbol format
    const idxSymbol = symbol.replace('.JK', '');
    const url = `https://www.investing.com/equities/indonesia-${idxSymbol.toLowerCase()}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const priceText = $('#last_last').text().replace(/,/g, '');
    const price = parseFloat(priceText);
    return isNaN(price) ? null : price;
  } catch (error) {
    logger.error('[IDXScraper]', `Error scraping Investing.com for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get Indonesian stock data from IDX.co.id
 * Note: This may require more sophisticated handling
 */
async function getIDXStock(symbol: string): Promise<number | null> {
  try {
    // IDX provides JSON data through their API
    const idxSymbol = symbol.replace('.JK', '');
    const url = `https://www.idx.co.id/primary/StockData/GetStockData?code=${idxSymbol}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.data?.Data?.[0]?.Previous) {
      return parseFloat(response.data.Data[0].Previous);
    }
    return null;
  } catch (error) {
    logger.error('[IDXScraper]', `Error getting IDX stock for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock price from MarketWatch
 */
async function getMarketWatchStock(symbol: string): Promise<number | null> {
  try {
    const url = `https://www.marketwatch.com/investing/stock/${symbol.toLowerCase()}`;
    const response = await axios.get(url, {
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
    logger.error('[IDXScraper]', `Error getting MarketWatch stock for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock data from Reuters (fallback)
 */
async function getReutersStock(symbol: string): Promise<number | null> {
  try {
    // Reuters has an API for stock data
    const url = `https://www.reuters.com/companies/${symbol.replace('.JK', '').toLowerCase()}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const priceElement = '[data-test="quote-price"]';
    const priceText = $(priceElement).first().text().replace(/,/g, '');
    const price = parseFloat(priceText);
    return isNaN(price) ? null : price;
  } catch (error) {
    logger.error('[IDXScraper]', `Error getting Reuters stock for ${symbol}:`, error);
    return null;
  }
}

/**
 * Main function to fetch stock price from multiple sources
 */
export async function fetchStockPrice(symbol: string, name?: string): Promise<{
  prices: StockPrice[];
  average: number | null;
  sources: string[];
}> {
  // Find stock name if not provided
  const stockInfo = POPULAR_INDONESIAN_STOCKS.find(s => s.symbol === symbol);
  const stockName = name || stockInfo?.name || symbol;

  const sources = [
    { name: 'Yahoo Finance', fn: () => getYahooFinanceStock(symbol) },
    { name: 'Investing.com', fn: () => scrapeInvestingDotComStock(symbol) },
    { name: 'IDX.co.id', fn: () => getIDXStock(symbol) },
    { name: 'MarketWatch', fn: () => getMarketWatchStock(symbol) },
    { name: 'Reuters', fn: () => getReutersStock(symbol) },
  ];

  const prices: StockPrice[] = [];
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
        symbol,
        name: stockName,
        price: result.value.price,
        currency: 'IDR',
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
 * Search Indonesian stocks by symbol or name
 * Now supports searching across all IDX-listed companies
 */
export async function searchStocks(
  query: string,
  limit: number = 50
): Promise<{ symbol: string; name: string }[]> {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return POPULAR_INDONESIAN_STOCKS;
  }

  // Search in local extended list first (faster)
  const localResults = EXTENDED_IDX_STOCKS.filter(
    stock =>
      stock.symbol.toLowerCase().includes(lowerQuery) ||
      stock.symbol.replace('.JK', '').toLowerCase().includes(lowerQuery) ||
      stock.name.toLowerCase().includes(lowerQuery)
  );

  if (localResults.length >= limit) {
    return localResults.slice(0, limit);
  }

  // If we need more results, try dynamic search via Yahoo Finance
  try {
    const dynamicResults = await searchIDXStocksDynamically(lowerQuery, limit);

    // Merge and deduplicate
    const allResults = [...localResults];
    const seenSymbols = new Set(localResults.map(s => s.symbol));

    for (const result of dynamicResults) {
      if (!seenSymbols.has(result.symbol)) {
        allResults.push(result);
        seenSymbols.add(result.symbol);
      }
    }

    return allResults.slice(0, limit);
  } catch (error) {
    // Fallback to local results if dynamic search fails
    return localResults.slice(0, limit);
  }
}

/**
 * Dynamically search IDX stocks using Yahoo Finance autocomplete
 * This gives access to 700+ IDX-listed companies
 */
async function searchIDXStocksDynamically(
  query: string,
  limit: number = 50
): Promise<{ symbol: string; name: string }[]> {
  try {
    // Yahoo Finance autocomplete API
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0&quotesQueryId=tss_match_phrase_query&multiQuoteQuotesCount=${limit}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    const results: { symbol: string; name: string }[] = [];

    if (response.data?.quotes) {
      for (const quote of response.data.quotes) {
        // Filter for Indonesian stocks (.JK suffix)
        if (quote.symbol && quote.symbol.endsWith('.JK')) {
          results.push({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('[IDXScraper] Dynamic search error:', error);
    return [];
  }
}

/**
 * Get all IDX stocks from cache or fetch fresh data
 */
export async function getAllIDXStocks(): Promise<{ symbol: string; name: string }[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (idxStocksCache && (now - cacheTimestamp) < CACHE_TTL) {
    return idxStocksCache;
  }

  try {
    // Fetch from Yahoo Finance using multiple queries to get comprehensive list
    const searchQueries = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

    const allStocks = new Map<string, string>();

    for (const letter of searchQueries) {
      try {
        const results = await searchIDXStocksDynamically(letter, 100);
        for (const stock of results) {
          const baseSymbol = stock.symbol.replace('.JK', '');
          allStocks.set(baseSymbol, stock.name);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        // Continue with next letter if one fails
        continue;
      }
    }

    // Convert map to array
    idxStocksCache = Array.from(allStocks.entries()).map(([symbol, name]) => ({
      symbol: `${symbol}.JK`,
      name,
    }));

    cacheTimestamp = now;

    return idxStocksCache;
  } catch (error) {
    console.error('[IDXScraper] Error fetching all IDX stocks:', error);
    // Fallback to extended list
    return EXTENDED_IDX_STOCKS;
  }
}

/**
 * Clear the IDX stocks cache (useful for testing)
 */
export function clearIDXStocksCache(): void {
  idxStocksCache = null;
  cacheTimestamp = 0;
}

/**
 * Get popular Indonesian stocks
 */
export function getPopularStocks(): typeof POPULAR_INDONESIAN_STOCKS {
  return POPULAR_INDONESIAN_STOCKS;
}

/**
 * Fetch multiple stock prices at once
 */
export async function fetchMultipleStockPrices(
  symbols: string[]
): Promise<Map<string, { average: number | null; sources: string[] }>> {
  const results = new Map<string, { average: number | null; sources: string[] }>();

  await Promise.all(
    symbols.map(async (symbol) => {
      const result = await fetchStockPrice(symbol);
      results.set(symbol, {
        average: result.average,
        sources: result.sources,
      });
    })
  );

  return results;
}

/**
 * Get stock price for API response
 */
export async function getStockPrice(symbol: string) {
  const result = await fetchStockPrice(symbol);

  if (result.average === null) {
    throw new Error(`Failed to fetch stock price for ${symbol} from any source`);
  }

  // Get stock name
  const stockInfo = POPULAR_INDONESIAN_STOCKS.find(s => s.symbol === symbol);

  return {
    symbol,
    name: stockInfo?.name || symbol,
    price: result.average,
    currency: 'IDR',
    sources: result.sources,
    individualPrices: result.prices,
    timestamp: new Date().toISOString(),
  };
}
