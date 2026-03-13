import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrices as getRealtimeHistory, getPrice as getRealtimePrice } from '@/lib/api/realtime';
import { generateForecast } from '@/lib/analysis/forecasting';
import { calculateAllIndicators, generateSignal } from '@/lib/analysis/technical-indicators';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolParam = searchParams.get('symbol')?.toUpperCase() || 'BTC-USD';
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(365, Math.max(30, parseInt(daysParam))) : 90;

    logger.api('[CryptoHistory]', `Fetching history for: ${symbolParam} (${days} days)`);

    // Fetch historical data from Real-time API
    const realtimeHistory = await getRealtimeHistory(symbolParam, days);
    const realtimeQuote = await getRealtimePrice(symbolParam);

    // Detailed error logging
    if (!realtimeHistory) {
      logger.warn('[CryptoHistory]', `Fetch failed: getRealtimeHistory returned null for ${symbolParam}`);
    }
    if (!realtimeQuote) {
      logger.warn('[CryptoHistory]', `Quote fetch failed: getRealtimePrice returned null for ${symbolParam}`);
    }

    if (!realtimeHistory || !realtimeQuote) {
      return NextResponse.json(
        {
          success: false,
          error: `Unable to fetch ${symbolParam} data. Please try again later.`,
          debug: {
            hasHistory: !!realtimeHistory,
            hasQuote: !!realtimeQuote,
            historyLength: realtimeHistory?.length ?? 0,
          },
        },
        { status: 503 }
      );
    }

    const prices = realtimeHistory.map(d => d.price);
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

    // Map crypto symbols to proper names
    const cryptoNames: Record<string, string> = {
      'BTC-USD': 'Bitcoin',
      'ETH-USD': 'Ethereum',
      'BNB-USD': 'Binance Coin',
      'SOL-USD': 'Solana',
      'XRP-USD': 'XRP',
      'ADA-USD': 'Cardano',
      'DOGE-USD': 'Dogecoin',
      'DOT-USD': 'Polkadot',
      'MATIC-USD': 'Polygon',
      'LINK-USD': 'Chainlink',
      'UNI-USD': 'Uniswap',
      'AVAX-USD': 'Avalanche',
      'ATOM-USD': 'Cosmos',
    };

    const cryptoName = cryptoNames[symbolParam] || symbolParam.replace('-USD', '');

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbolParam,
        name: cryptoName,
        currentPrice,
        currency: realtimeQuote.currency,
        historicalData: realtimeHistory,
        indicators,
        signal,
        forecast,
      },
    });
  } catch (error) {
    logger.error('[CryptoHistory] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto history',
      },
      { status: 500 }
    );
  }
}
