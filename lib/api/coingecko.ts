/**
 * CoinGecko API Integration
 * Provides comprehensive cryptocurrency data (15,000+ cryptocurrencies)
 * Free tier: 50 calls/minute (sufficient for most use cases)
 *
 * Documentation: https://www.coingecko.com/en/api/documentation
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank?: number;
  thumb?: string;
  large?: string;
}

export interface CoinGeckoSearchResult {
  coins: CoinGeckoCoin[];
}

export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  };
}

/**
 * Search for cryptocurrencies
 * @param query - Search query (coin name, symbol, or ID)
 * @returns Array of matching cryptocurrencies
 */
export async function searchCrypto(query: string): Promise<CoinGeckoCoin[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko search failed: ${response.status}`);
    }

    const data: CoinGeckoSearchResult = await response.json();

    if (!data.coins) {
      return [];
    }

    // Transform to standard format
    return data.coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.thumb || coin.large || coin.image,
      marketCapRank: coin.market_cap_rank,
      type: 'CRYPTO' as const,
      exchange: 'Multi',
      country: 'Global',
    }));
  } catch (error) {
    console.error('[CoinGecko] Search failed:', error);
    return [];
  }
}

/**
 * Get current price for a cryptocurrency
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
 * @returns Price in USD
 */
export async function getCryptoPrice(coinId: string): Promise<{
  price: number;
  currency: string;
  change24h?: number;
} | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko price failed: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();

    if (!data[coinId]) {
      return null;
    }

    const coinData = data[coinId];

    return {
      price: coinData.usd,
      currency: 'USD',
      change24h: coinData.usd_24h_change,
    };
  } catch (error) {
    console.error(`[CoinGecko] Price fetch failed for ${coinId}:`, error);
    return null;
  }
}

/**
 * Get trending cryptocurrencies (top 7)
 * @returns Array of trending coins
 */
export async function getTrendingCrypto(): Promise<CoinGeckoCoin[]> {
  try {
    const response = await fetch(`${COINGECKO_API}/search/trending`);

    if (!response.ok) {
      throw new Error(`CoinGecko trending failed: ${response.status}`);
    }

    const data = await response.json();

    return data.coins?.map((item: any) => ({
      id: item.item.id,
      symbol: item.item.symbol.toUpperCase(),
      name: item.item.name,
      image: item.item.thumb || item.item.small,
      marketCapRank: item.item.market_cap_rank,
      type: 'CRYPTO' as const,
      exchange: 'Multi',
      country: 'Global',
    })) || [];
  } catch (error) {
    console.error('[CoinGecko] Trending fetch failed:', error);
    return [];
  }
}

/**
 * Get top cryptocurrencies by market cap
 * @param limit - Number of coins to return (1-250)
 * @returns Array of top cryptocurrencies
 */
export async function getTopCryptoByMarketCap(limit: number = 100): Promise<CoinGeckoCoin[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko top coins failed: ${response.status}`);
    }

    const data = await response.json();

    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      marketCapRank: coin.market_cap_rank,
      type: 'CRYPTO' as const,
      exchange: 'Multi',
      country: 'Global',
    }));
  } catch (error) {
    console.error('[CoinGecko] Top coins fetch failed:', error);
    return [];
  }
}

/**
 * Get coin list (all coins supported by CoinGecko)
 * Useful for populating a search database
 * @returns Array of all supported coins
 */
export async function getCoinList(): Promise<CoinGeckoCoin[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/list`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko list failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CoinGecko] Coin list fetch failed:', error);
    return [];
  }
}

/**
 * Convert common crypto symbols to CoinGecko IDs
 */
export function symbolToCoinId(symbol: string): string {
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LTC': 'litecoin',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'ATOM': 'cosmos',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'COMP': 'compound-governance',
    'MKR': 'maker',
    'SUSHI': 'sushi',
    'CRV': 'curve-dao-token',
    'YFI': 'yearn-finance',
    '1INCH': '1inch',
    'ENJ': 'enjincoin',
    'MANA': 'decentraland',
    'SAND': 'the-sandbox',
    'AXS': 'axs-infinity',
    'GALA': 'gala',
    'FET': 'fetch-ai',
    'VET': 'vechain',
    'THETA': 'theta-token',
    'CHZ': 'chronobank',
    'TRX': 'tron',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'ICP': 'internet-computer',
    'HBAR': 'hedera-hashgraph',
    'NEAR': 'near',
    'FTM': 'fantom',
    'APE': 'apecoin',
    'SHIB': 'shiba-inu',
    'LUNC': 'terra-luna-2',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'INJ': 'injective-protocol',
    'IMX': 'immutable-x',
    'GMT': 'stepn',
    'RNDR': 'render-token',
    'FXS': 'frax-share',
    'QI': 'theta-network',
    'MINA': 'mina-protocol',
    'CELO': 'celo',
    'HOT': 'holo',
    'MASK': 'mask-network',
    'AMP': 'amp-token',
  };

  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Get multiple coin prices at once
 * @param symbols - Array of crypto symbols
 * @returns Map of symbol to price data
 */
export async function getMultipleCryptoPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const coinIds = symbols.map(symbolToCoinId).join(',');

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko multiple prices failed: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();

    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      const coinId = symbolToCoinId(symbol);
      if (data[coinId]?.usd) {
        prices[symbol] = data[coinId].usd;
      }
    }

    return prices;
  } catch (error) {
    console.error('[CoinGecko] Multiple prices failed:', error);
    return {};
  }
}
