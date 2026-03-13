import { NextRequest, NextResponse } from 'next/server';
import { getPrice as getRealtimePrice } from '@/lib/api/realtime';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'BTC-USD';

    logger.api('[CryptoAPI]', `Fetching price for: ${symbol}`);

    // Fetch real-time price from Yahoo Finance
    const cryptoData = await getRealtimePrice(symbol);

    if (!cryptoData || !cryptoData.price || cryptoData.price <= 0) {
      logger.warn('[CryptoAPI]', `Failed to fetch price for ${symbol}`);
      return NextResponse.json(
        {
          success: false,
          error: `Unable to fetch price for ${symbol}. Please verify the symbol is correct (e.g., BTC-USD, ETH-USD)`,
        },
        { status: 404 }
      );
    }

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

    const cryptoName = cryptoNames[symbol] || symbol.replace('-USD', '');

    // Return consistent data format
    const data = {
      symbol: symbol,
      name: cryptoName,
      price: cryptoData.price,
      change: cryptoData.change || 0,
      changePercent: cryptoData.changePercent || 0,
      currency: cryptoData.currency || 'USD',
      sources: ['Yahoo Finance', 'Real-time'],
      timestamp: new Date().toISOString(),
    };

    logger.debug('[CryptoAPI]', `Successfully fetched ${cryptoName}: $${cryptoData.price.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('[CryptoAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto price',
      },
      { status: 500 }
    );
  }
}
