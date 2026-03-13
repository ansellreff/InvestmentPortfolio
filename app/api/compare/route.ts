import { NextRequest, NextResponse } from 'next/server';
import { getGoldPrice } from '@/lib/scrapers/gold-scraper';
import { getStockPrice } from '@/lib/scrapers/idx-scraper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbols parameter is required (comma-separated)',
        },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const results: any[] = [];

    for (const symbol of symbols) {
      if (symbol === 'GOLD') {
        const goldData = await getGoldPrice();
        results.push({
          ...goldData,
          type: 'GOLD',
        });
      } else {
        // Assume it's a stock
        try {
          const stockData = await getStockPrice(symbol);
          results.push({
            ...stockData,
            type: 'STOCK',
          });
        } catch (error) {
          results.push({
            symbol,
            error: error instanceof Error ? error.message : 'Failed to fetch data',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error comparing instruments:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare instruments',
      },
      { status: 500 }
    );
  }
}
