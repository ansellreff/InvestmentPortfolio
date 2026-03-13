import { NextRequest, NextResponse } from 'next/server';
import { searchSecurities, POPULAR_US_STOCKS, POPULAR_ETFS, POPULAR_INDICES } from '@/lib/api/finnhub';
import { apiRateLimit } from '@/lib/utils/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toUpperCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'stock', 'etf', 'index', or 'all'

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

    // If no query, return popular stocks
    if (!query) {
      let popularStocks = POPULAR_US_STOCKS;

      if (type === 'etf') {
        popularStocks = POPULAR_ETFS;
      } else if (type === 'index') {
        popularStocks = POPULAR_INDICES;
      }

      return NextResponse.json({
        success: true,
        data: popularStocks.map(s => ({
          symbol: s.symbol,
          name: s.name,
        })),
        source: 'local',
      });
    }

    // Search via Finnhub API (90,000+ securities)
    const finnhubResults = await searchSecurities(query);

    if (finnhubResults.length > 0) {
      // Filter by type if specified
      let filteredResults = finnhubResults;
      if (type && type !== 'all') {
        filteredResults = finnhubResults.filter(r => {
          if (type === 'stock') return r.type === 'STOCK';
          if (type === 'etf') return r.type === 'ETF';
          if (type === 'index') return r.type === 'INDEX';
          return true;
        });
      }

      const results = filteredResults.slice(0, limit).map((item) => ({
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        exchange: item.exchange,
      }));

      return NextResponse.json({
        success: true,
        data: results,
        source: 'Finnhub',
        total: filteredResults.length,
      });
    }

    // Fallback to local popular stocks
    const fallbackResults = [
      ...POPULAR_US_STOCKS,
      ...POPULAR_ETFS,
      ...POPULAR_INDICES,
    ].filter(
      stock =>
        stock.symbol.includes(query) ||
        stock.name.toUpperCase().includes(query)
    ).slice(0, limit);

    if (fallbackResults.length > 0) {
      return NextResponse.json({
        success: true,
        data: fallbackResults.map(s => ({
          symbol: s.symbol,
          name: s.name,
        })),
        source: 'local',
      });
    }

    // If still no results, return empty
    return NextResponse.json({
      success: false,
      error: 'No securities found',
      data: [],
    });
  } catch (error) {
    console.error('[StockSearch] Error searching stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search stocks',
        data: [],
      },
      { status: 500 }
    );
  }
}
