import { NextRequest, NextResponse } from 'next/server';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { getPrice as getRealtimePrice } from '@/lib/api/realtime';
import { getQuote } from '@/lib/api/finnhub';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Batch Price API - Direct Function Calls (No HTTP)
 *
 * This endpoint fetches multiple prices in parallel by calling
 * the underlying functions directly instead of making HTTP requests.
 * This is much faster and works reliably on Vercel.
 */

interface PriceResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdate: number;
}

// Helper function to fetch gold/silver/platinum/palladium price
async function fetchMetalPrice(metal: 'gold' | 'silver' | 'platinum' | 'palladium'): Promise<PriceResult | null> {
  try {
    const data = await getMetalPriceWithChange(metal);
    if (data?.price) {
      return {
        symbol: metal.toUpperCase(),
        price: data.price,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        currency: data.currency || 'USD',
        lastUpdate: Date.now()
      };
    }
  } catch (error) {
    logger.warn(`[BatchPrice] Failed to fetch ${metal}:`, error);
  }
  return null;
}

// Helper function to fetch crypto price
async function fetchCryptoPrice(symbol: string): Promise<PriceResult | null> {
  try {
    const data = await getRealtimePrice(symbol.includes('-') ? symbol : `${symbol}-USD`);
    if (data?.price && data.price > 0) {
      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        currency: data.currency || 'USD',
        lastUpdate: Date.now()
      };
    }
  } catch (error) {
    logger.warn(`[BatchPrice] Failed to fetch crypto ${symbol}:`, error);
  }
  return null;
}

// Helper function to fetch stock price
async function fetchStockPrice(symbol: string): Promise<PriceResult | null> {
  try {
    // Try Finnhub first for US stocks
    const finnhubQuote = await getQuote(symbol);
    if (finnhubQuote?.c && finnhubQuote.c > 0) {
      return {
        symbol: symbol.toUpperCase(),
        price: finnhubQuote.c,
        change: finnhubQuote.d || 0,
        changePercent: finnhubQuote.dp || 0,
        currency: 'USD',
        lastUpdate: Date.now()
      };
    }

    // Fallback to real-time API
    const data = await getRealtimePrice(symbol);
    if (data?.price && data.price > 0) {
      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        currency: data.currency || 'USD',
        lastUpdate: Date.now()
      };
    }
  } catch (error) {
    logger.warn(`[BatchPrice] Failed to fetch stock ${symbol}:`, error);
  }
  return null;
}

// Determine symbol type and fetch appropriate price
async function fetchSymbolPrice(symbol: string): Promise<PriceResult | null> {
  const typeUpper = String(symbol).toUpperCase();

  // Precious metals
  if (typeUpper === 'GOLD' || typeUpper === 'XAU') {
    return fetchMetalPrice('gold' as const);
  }
  if (typeUpper === 'SILVER' || typeUpper === 'XAG') {
    return fetchMetalPrice('silver' as const);
  }
  if (typeUpper === 'PLATINUM' || typeUpper === 'XPT') {
    return fetchMetalPrice('platinum' as const);
  }
  if (typeUpper === 'PALLADIUM' || typeUpper === 'XPD') {
    return fetchMetalPrice('palladium' as const);
  }

  // Crypto symbols - check if it matches known cryptocurrencies
  const knownCrypto = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'BNB', 'USDT', 'USDC', 'DAI'];
  const isCrypto = knownCrypto.some(c => typeUpper.includes(c) || typeUpper.startsWith(c) || typeUpper.endsWith(c));

  if (isCrypto) {
    return fetchCryptoPrice(symbol);
  }

  // Indonesian stocks end with .JK
  if (typeUpper.endsWith('.JK')) {
    return fetchStockPrice(symbol);
  }

  // Default to stock
  return fetchStockPrice(symbol);
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { success: false, error: 'Invalid symbols: expected array' },
        { status: 400 }
      );
    }

    // Deduplicate symbols
    const uniqueSymbols = Array.from(new Set(symbols));

    logger.api('[BatchPrice]', `Fetching prices for ${uniqueSymbols.length} symbols`);

    // Fetch all prices in parallel using direct function calls
    const pricePromises = uniqueSymbols.map(fetchSymbolPrice);
    const results = await Promise.all(pricePromises);

    const priceMap: Record<string, PriceResult> = {};

    results.forEach((result, index) => {
      if (result) {
        priceMap[uniqueSymbols[index]] = result;
      }
    });

    logger.debug('[BatchPrice]', `Successfully fetched ${Object.keys(priceMap).length} prices`);

    return NextResponse.json({ success: true, data: priceMap });
  } catch (error) {
    logger.error('[BatchPrice] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) || [];

  if (symbols.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No symbols provided' },
      { status: 400 }
    );
  }

  // Create a mock request body for the POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ symbols })
  });

  return POST(mockRequest as NextRequest);
}
