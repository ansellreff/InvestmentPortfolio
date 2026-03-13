import { NextRequest, NextResponse } from 'next/server';
import { getStockCandles } from '@/lib/api/finnhub';
import { getHistoricalPrices as getRealtimeHistory, getPrice as getRealtimePrice, getQuote } from '@/lib/api/realtime';
import { generateForecast } from '@/lib/analysis/forecasting';
import { calculateAllIndicators, generateSignal } from '@/lib/analysis/technical-indicators';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(365, Math.max(30, parseInt(daysParam))) : 90;

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }

    let historicalData = null;
    let realtimeQuote = null;
    let source = 'Unknown';

    // Try Finnhub first for US stocks
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);

    try {
      const candles = await getStockCandles(symbol, 'D', from, to);

      if (candles && candles.s === 'ok' && candles.c.length > 0) {
        historicalData = candles.c.map((close, i) => ({
          date: new Date(candles.t[i] * 1000).toISOString(),
          price: close,
          high: candles.h[i],
          low: candles.l[i],
          open: candles.o[i],
          volume: candles.v[i],
        }));

        // Get current quote
        const quote = await getQuote(symbol);
        if (quote) {
          realtimeQuote = {
            price: quote.price,
            name: quote.name || symbol,
            currency: quote.currency || 'USD',
          };
        }

        source = 'Finnhub';
        logger.api('[StockHistory]', `Fetched ${symbol} from Finnhub`);
      }
    } catch (err) {
      logger.debug('[StockHistory] Finnhub failed, trying fallback');
    }

    // Fallback to Real-time API (Yahoo Finance)
    if (!historicalData || historicalData.length === 0) {
      historicalData = await getRealtimeHistory(symbol, days);
      realtimeQuote = await getRealtimePrice(symbol);
      source = 'Yahoo Finance';
      logger.api('[StockHistory]', `Fetched ${symbol} from Yahoo Finance`);
    }

    if (!historicalData || !realtimeQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch stock data. Please check the symbol and try again.',
          debug: {
            symbol,
            hasHistory: !!historicalData,
            hasQuote: !!realtimeQuote,
            historyLength: historicalData?.length || 0,
          },
        },
        { status: 404 }
      );
    }

    const prices = historicalData.map(d => d.price);
    const currentPrice = realtimeQuote.price;

    // Validate we have enough data
    if (!prices || prices.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient historical data available. Please try again later.',
        },
        { status: 503 }
      );
    }

    // Calculate technical indicators
    const indicators = calculateAllIndicators(prices);

    // Generate trading signal
    const signal = generateSignal(indicators, currentPrice);

    // Generate forecast
    const forecast = generateForecast(prices, 30);

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        name: realtimeQuote.name,
        currentPrice,
        currency: realtimeQuote.currency,
        historicalData,
        indicators,
        signal,
        forecast,
        source,
      },
    });
  } catch (error) {
    logger.error('[StockHistory] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock history',
      },
      { status: 500 }
    );
  }
}
