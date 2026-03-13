import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/api/finnhub';
import { getPrice as getRealtimePrice } from '@/lib/api/realtime';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // Try Finnhub first for US stocks (faster, more reliable)
    const finnhubQuote = await getQuote(upperSymbol);

    if (finnhubQuote && finnhubQuote.c > 0) {
      logger.api('[StockPrice]', `Fetched ${upperSymbol} from Finnhub`);

      return NextResponse.json({
        success: true,
        data: {
          symbol: upperSymbol,
          name: upperSymbol,
          price: finnhubQuote.c,
          change: finnhubQuote.d,
          changePercent: finnhubQuote.dp,
          high: finnhubQuote.h,
          low: finnhubQuote.l,
          open: finnhubQuote.o,
          previousClose: finnhubQuote.pc,
          currency: 'USD',
          source: 'Finnhub',
          timestamp: new Date(finnhubQuote.t * 1000).toISOString(),
        },
      });
    }

    // Fallback to Real-time API (Yahoo Finance, Twelve Data)
    logger.api('[StockPrice]', `Finnhub failed for ${upperSymbol}, using fallback`);
    const realtimeData = await getRealtimePrice(upperSymbol);

    if (!realtimeData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch stock price. Please check the symbol and try again.',
        },
        { status: 404 }
      );
    }

    // Return consistent data format
    const stockData = {
      symbol: upperSymbol,
      name: realtimeData.name,
      price: realtimeData.price,
      change: realtimeData.change,
      changePercent: realtimeData.changePercent,
      currency: realtimeData.currency,
      individualPrices: [
        {
          price: realtimeData.price,
          currency: realtimeData.currency,
          source: 'Real-time API',
        }
      ],
      sources: ['Yahoo Finance', 'Twelve Data'],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: stockData,
    });
  } catch (error) {
    logger.error('[StockPrice] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock price',
      },
      { status: 500 }
    );
  }
}
