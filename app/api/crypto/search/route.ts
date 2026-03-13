import { NextRequest, NextResponse } from 'next/server';
import { searchCrypto, getTopCryptoByMarketCap } from '@/lib/api/coingecko';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Local popular cryptocurrencies cache
const POPULAR_CRYPTOS = [
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'BNB-USD', name: 'Binance Coin' },
  { symbol: 'SOL-USD', name: 'Solana' },
  { symbol: 'XRP-USD', name: 'XRP' },
  { symbol: 'ADA-USD', name: 'Cardano' },
  { symbol: 'DOGE-USD', name: 'Dogecoin' },
  { symbol: 'DOT-USD', name: 'Polkadot' },
  { symbol: 'MATIC-USD', name: 'Polygon' },
  { symbol: 'LINK-USD', name: 'Chainlink' },
  { symbol: 'UNI-USD', name: 'Uniswap' },
  { symbol: 'AVAX-USD', name: 'Avalanche' },
  { symbol: 'ATOM-USD', name: 'Cosmos' },
  { symbol: 'LTC-USD', name: 'Litecoin' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toUpperCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');

    // If no query, return popular cryptos
    if (!query) {
      return NextResponse.json({
        success: true,
        data: POPULAR_CRYPTOS,
        source: 'local',
      });
    }

    // Try CoinGecko API first (15,000+ cryptocurrencies)
    const coingeckoResults = await searchCrypto(query);

    if (coingeckoResults.length > 0) {
      // Transform to expected format
      const results = coingeckoResults.slice(0, limit).map((coin) => ({
        symbol: `${coin.symbol}-USD`,
        name: coin.name,
      }));

      return NextResponse.json({
        success: true,
        data: results,
        source: 'CoinGecko',
        total: coingeckoResults.length,
      });
    }

    // Fallback to local popular cryptos
    const exactMatches = POPULAR_CRYPTOS.filter(
      (crypto) => crypto.symbol === query || crypto.symbol.replace('-USD', '') === query
    );

    const partialMatches = POPULAR_CRYPTOS.filter(
      (crypto) =>
        crypto.symbol.includes(query) ||
        crypto.name.toUpperCase().includes(query) ||
        crypto.symbol.replace('-USD', '').includes(query)
    ).filter((crypto) => !exactMatches.some((match) => match.symbol === crypto.symbol));

    const results = [...exactMatches, ...partialMatches].slice(0, 10);

    if (results.length > 0) {
      return NextResponse.json({
        success: true,
        data: results,
        source: 'local',
      });
    }

    // If still no results, return empty
    return NextResponse.json({
      success: false,
      error: 'No cryptocurrencies found',
      data: [],
    });
  } catch (error) {
    console.error('[CryptoSearch] Error searching cryptos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search cryptocurrencies',
        data: [],
      },
      { status: 500 }
    );
  }
}
