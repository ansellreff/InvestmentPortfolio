import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Debug endpoint to test metals prices
 * GET /api/debug/metals
 */
export async function GET() {
  const metals = ['gold', 'silver', 'platinum', 'palladium'] as const;
  const results: Record<string, any> = {};

  for (const metal of metals) {
    try {
      const yahooSymbols: Record<string, string> = {
        gold: 'GC=F',
        silver: 'SI=F',
        platinum: 'PL=F',
        palladium: 'PA=F',
      };

      const symbol = yahooSymbols[metal];
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        results[metal] = { error: `HTTP ${response.status}` };
        continue;
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        results[metal] = { error: 'No chart result' };
        continue;
      }

      const meta = result?.meta;
      const quote = result?.indicators?.quote?.[0];

      if (!meta || !quote || !quote.close) {
        results[metal] = { error: 'Invalid data format' };
        continue;
      }

      const closeArray = Array.isArray(quote.close) ? quote.close : [quote.close];
      const validClosePrices = closeArray.filter((p: number | null) => p !== null && p !== undefined);

      if (validClosePrices.length === 0) {
        results[metal] = { error: 'No valid prices' };
        continue;
      }

      const price = validClosePrices[validClosePrices.length - 1];

      results[metal] = {
        symbol,
        yahooSymbol: symbol,
        price: price,
        currency: meta.currency || 'USD',
        previousClose: meta.previousClose,
        exchange: meta.exchangeName,
      };
    } catch (error) {
      results[metal] = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json({
    success: true,
    data: results,
    timestamp: new Date().toISOString(),
  });
}
