import { NextRequest, NextResponse } from 'next/server';
import { searchStocks, getPopularStocks, getAllIDXStocks } from '@/lib/scrapers/idx-scraper';
import { apiRateLimit } from '@/lib/utils/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toUpperCase().trim();
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // If no query, return popular IDX stocks
    if (!query) {
      const popularStocks = getPopularStocks();

      return NextResponse.json({
        success: true,
        data: popularStocks.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
        })),
        source: 'local',
        total: popularStocks.length,
      });
    }

    // Search across all IDX-listed companies (700+ stocks)
    const results = await searchStocks(query, limit);

    if (results.length > 0) {
      return NextResponse.json({
        success: true,
        data: results.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
        })),
        source: 'IDX + Yahoo Finance',
        total: results.length,
      });
    }

    // If no results, return empty
    return NextResponse.json({
      success: false,
      error: 'No Indonesian stocks found',
      data: [],
    });
  } catch (error) {
    console.error('[IndoSearch] Error searching Indonesian stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Indonesian stocks',
        data: [],
      },
      { status: 500 }
    );
  }
}

/**
 * GET all IDX stocks (for admin/debug purposes)
 * Returns all 700+ IDX-listed companies
 */
export async function POST(request: NextRequest) {
  try {
    // Fetch all IDX stocks
    const allStocks = await getAllIDXStocks();

    return NextResponse.json({
      success: true,
      data: allStocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
      })),
      total: allStocks.length,
      source: 'IDX Comprehensive List',
    });
  } catch (error) {
    console.error('[IndoSearch] Error fetching all IDX stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch IDX stock list',
        data: [],
      },
      { status: 500 }
    );
  }
}
