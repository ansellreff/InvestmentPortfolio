import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities, POPULAR_US_STOCKS } from '@/lib/api/finnhub';
import { searchStocks, getPopularStocks } from '@/lib/scrapers/idx-scraper';
import { searchCrypto, getTopCryptoByMarketCap } from '@/lib/api/coingecko';
import { apiRateLimit } from '@/lib/utils/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX' | 'INDO_STOCK';
  exchange?: string;
  country?: string;
  marketCap?: number;        // Market capitalization (for sorting)
  marketCapRank?: number;    // Rank by market cap (1 = highest)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type'); // 'stock', 'crypto', 'indo', 'etf', 'index', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!apiRateLimit.check(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // If no query, return popular instruments based on type filter
    if (!query) {
      const results: SearchResult[] = [];

      // Calculate how many items per category
      const isSingleCategory = type === 'stock' || type === 'indo' || type === 'crypto';
      const perCategory = isSingleCategory ? limit : Math.min(15, limit / 3);

      // Only add categories that match the type filter
      if (!type || type === 'all' || type === 'stock') {
        // Predefined market caps for popular stocks (in billions, approximate)
        const marketCaps: Record<string, number> = {
          'AAPL': 3500, 'MSFT': 3100, 'GOOGL': 2900, 'AMZN': 2800, 'NVDA': 2600,
          'META': 1300, 'BRK.B': 1000, 'LLY': 750, 'AVGO': 700, 'JPM': 550,
          'V': 520, 'JNJ': 480, 'WMT': 450, 'XOM': 420, 'MA': 400,
          'PG': 390, 'UNH': 480, 'HD': 380, 'CVX': 300, 'MRK': 280,
          'ABBV': 380, 'COST': 350, 'PEP': 240, 'BAC': 270, 'KO': 250,
          'TMO': 280, 'CMCSA': 290, 'CSCO': 260, 'NFLX': 270, 'ADBE': 260,
          'DIS': 200, 'INTC': 180, 'CRM': 290, 'ORCL': 320, 'WFC': 200,
          'ACN': 230, 'IBM': 200, 'GS': 140, 'CAT': 170, 'RTX': 140,
          'MDT': 150, 'NKE': 160, 'BA': 130, 'TRV': 110, 'HON': 150,
          'UNP': 150, 'MMM': 120, 'UPS': 140, 'MRNA': 200
        };

        results.push(
          ...POPULAR_US_STOCKS.slice(0, type === 'stock' ? Math.min(limit, POPULAR_US_STOCKS.length) : perCategory).map((s, index) => ({
            symbol: s.symbol,
            name: s.name,
            type: 'STOCK' as const,
            exchange: 'US',
            country: 'US',
            marketCap: marketCaps[s.symbol] || (100 - index), // Fallback for unknown
            marketCapRank: index + 1,
          }))
        );
      }

      if (!type || type === 'all' || type === 'indo') {
        const indoStocks = getPopularStocks();
        // Predefined market caps for popular Indo stocks (in billions IDR, approximate)
        const indoMarketCaps: Record<string, number> = {
          'BBCA.JK': 1200, 'BBRI.JK': 1100, 'BMRI.JK': 1000, 'BBNI.JK': 850,
          'TLKM.JK': 450, 'UNVR.JK': 380, 'ASII.JK': 350, 'ICBP.JK': 320,
          'INDF.JK': 280, 'GGRM.JK': 300, 'ADRO.JK': 250, 'EXCL.JK': 200,
          'ISAT.JK': 220, 'PGAS.JK': 180, 'KLBF.JK': 150, 'MEDC.JK': 140,
          'WSKT.JK': 130, 'MNCN.JK': 120, 'TOWR.JK': 110, 'PWON.JK': 100
        };

        results.push(
          ...indoStocks.slice(0, type === 'indo' ? Math.min(limit, indoStocks.length) : perCategory).map((s, index) => ({
            symbol: s.symbol,
            name: s.name,
            type: 'INDO_STOCK' as const,
            exchange: 'IDX',
            country: 'Indonesia',
            marketCap: indoMarketCaps[s.symbol] || (100 - index), // Fallback
            marketCapRank: index + 1,
          }))
        );
      }

      if (!type || type === 'all' || type === 'crypto') {
        const cryptoLimit = type === 'crypto' ? limit : perCategory;
        const topCrypto = await getTopCryptoByMarketCap(cryptoLimit);
        results.push(
          ...topCrypto.map((c: any, index: number) => ({
            symbol: `${c.symbol.toUpperCase()}-USD`,
            name: c.name,
            type: 'CRYPTO' as const,
            exchange: 'Multi',
            country: 'Global',
            marketCapRank: c.marketCapRank || index + 1, // CoinGecko provides rank
          }))
        );
      }

      // Sort by market cap (largest first) - professional approach
      // Data is already in market cap order, just slice the results
      const sorted = results.slice(0, limit);

      return NextResponse.json({
        success: true,
        data: sorted,
        source: 'popular',
      });
    }

    const upperQuery = query.toUpperCase();
    const allResults: SearchResult[] = [];

    // Search US Stocks (if type is 'all', 'stock', or not specified)
    if (!type || type === 'all' || type === 'stock') {
      try {
        const usStockResults = await searchSecurities(upperQuery);
        allResults.push(...usStockResults
          .filter(r => r.type === 'STOCK')
          .slice(0, limit / 3)
          .map(r => ({
            symbol: r.symbol,
            name: r.name,
            type: 'STOCK' as const,
            exchange: r.exchange,
            country: r.country,
          }))
        );
      } catch {
        // Continue if Finnhub fails
      }
    }

    // Search Cryptocurrencies (if type is 'all', 'crypto', or not specified)
    if (!type || type === 'all' || type === 'crypto') {
      try {
        const cryptoResults = await searchCrypto(upperQuery);
        allResults.push(...cryptoResults
          .slice(0, limit / 3)
          .map(c => ({
            symbol: `${c.symbol.toUpperCase()}-USD`,
            name: c.name,
            type: 'CRYPTO' as const,
            exchange: 'Multi',
            country: 'Global',
          }))
        );
      } catch {
        // Continue if CoinGecko fails
      }
    }

    // Search Indonesian Stocks (if type is 'all', 'indo', or not specified)
    if (!type || type === 'all' || type === 'indo') {
      try {
        const indoResults = await searchStocks(upperQuery, limit / 3);
        allResults.push(...indoResults
          .map(s => ({
            symbol: s.symbol,
            name: s.name,
            type: 'INDO_STOCK' as const,
            exchange: 'IDX',
            country: 'Indonesia',
          }))
        );
      } catch {
        // Continue if IDX search fails
      }
    }

    // Search ETFs (if type is 'all', 'etf')
    if (type === 'all' || type === 'etf') {
      try {
        const etfResults = await searchSecurities(upperQuery);
        allResults.push(...etfResults
          .filter(r => r.type === 'ETF')
          .slice(0, limit / 4)
          .map(r => ({
            symbol: r.symbol,
            name: r.name,
            type: 'ETF' as const,
            exchange: r.exchange,
            country: r.country,
          }))
        );
      } catch {
        // Continue if Finnhub fails
      }
    }

    // Search Indices (if type is 'all', 'index')
    if (type === 'all' || type === 'index') {
      try {
        const indexResults = await searchSecurities(upperQuery);
        allResults.push(...indexResults
          .filter(r => r.type === 'INDEX')
          .slice(0, limit / 4)
          .map(r => ({
            symbol: r.symbol,
            name: r.name,
            type: 'INDEX' as const,
            exchange: r.exchange,
            country: r.country,
          }))
        );
      } catch {
        // Continue if Finnhub fails
      }
    }

    // Remove duplicates based on symbol
    const seen = new Set<string>();
    const uniqueResults = allResults.filter(result => {
      const key = `${result.symbol}-${result.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniqueResults.length > 0) {
      return NextResponse.json({
        success: true,
        data: uniqueResults.slice(0, limit),
        total: uniqueResults.length,
        sources: ['Finnhub', 'CoinGecko', 'IDX/Yahoo Finance'],
      });
    }

    // If no results from APIs, return empty
    return NextResponse.json({
      success: false,
      error: 'No results found. Try a different search term.',
      data: [],
    });
  } catch (error) {
    console.error('[UnifiedSearch] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed. Please try again.',
        data: [],
      },
      { status: 500 }
    );
  }
}
