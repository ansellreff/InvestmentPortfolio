import { NextResponse } from 'next/server';
import { getPrice as getRealtimePrice } from '@/lib/api/realtime';
import { logger } from '@/lib/utils/logger';

// List of popular cryptocurrencies to track
const POPULAR_CRYPTOS = [
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'BNB-USD', name: 'Binance Coin' },
  { symbol: 'SOL-USD', name: 'Solana' },
  { symbol: 'XRP-USD', name: 'XRP' },
  { symbol: 'ADA-USD', name: 'Cardano' },
  { symbol: 'DOGE-USD', name: 'Dogecoin' },
  { symbol: 'DOT-USD', name: 'Polkadot' },
];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    logger.api('[CryptoPopular]', 'Fetching popular cryptocurrencies');

    const results = [];

    for (const crypto of POPULAR_CRYPTOS) {
      try {
        const data = await getRealtimePrice(crypto.symbol);

        if (data && data.price && data.price > 0) {
          results.push({
            symbol: crypto.symbol,
            name: crypto.name,
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            currency: data.currency || 'USD',
          });
          logger.debug('[CryptoPopular]', `${crypto.name}: $${data.price.toFixed(2)} (${(data.changePercent || 0).toFixed(2)}%)`);
        }
      } catch (error) {
        logger.warn('[CryptoPopular]', `Failed to fetch ${crypto.symbol}:`, error);
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch cryptocurrency prices at this time.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('[CryptoPopular] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto prices',
      },
      { status: 500 }
    );
  }
}
