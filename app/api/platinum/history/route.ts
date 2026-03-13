import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrices as getRealtimeHistory } from '@/lib/api/realtime';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { generateForecast } from '@/lib/analysis/forecasting';
import { calculateAllIndicators, generateSignal } from '@/lib/analysis/technical-indicators';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(365, Math.max(30, parseInt(daysParam))) : 90;

    // Fetch historical data from Yahoo Finance (PL=F)
    const realtimeHistory = await getRealtimeHistory('PL=F', days);

    // Fetch current price from Metals Live API (consistent with price endpoint)
    const metalsPrice = await getMetalPriceWithChange('platinum');

    // Use metals price for current, historical data for charts
    const currentPrice = metalsPrice?.price || 0;
    const currency = metalsPrice?.currency || 'USD';

    if (!realtimeHistory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch platinum data. Please try again later.',
          debug: {
            hasHistory: false,
            hasPrice: !!metalsPrice,
            historyLength: 0,
          },
        },
        { status: 503 }
      );
    }

    const prices = realtimeHistory.map(d => d.price);

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
        symbol: 'PLATINUM',
        name: 'Platinum Spot',
        currentPrice,
        currency,
        historicalData: realtimeHistory,
        indicators,
        signal,
        forecast,
        priceSource: 'Metals Live API',
        historySource: 'Yahoo Finance (PL=F)',
      },
    });
  } catch (error) {
    logger.error('[PlatinumHistory] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platinum history',
      },
      { status: 500 }
    );
  }
}
