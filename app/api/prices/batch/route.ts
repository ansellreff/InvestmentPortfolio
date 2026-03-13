import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { success: false, error: 'Invalid symbols: expected array' },
        { status: 400 }
      );
    }

    // Deduplicate symbols
    const uniqueSymbols = Array.from(new Set(symbols));

    // Fetch all prices in parallel
    const pricePromises = uniqueSymbols.map(async (symbol: string) => {
      try {
        // Determine symbol type and route to correct API
        const typeUpper = String(symbol).toUpperCase();
        let endpoint = '';

        // Check for precious metals
        if (typeUpper === 'GOLD' || typeUpper === 'XAU') {
          endpoint = '/api/gold/price';
        } else if (typeUpper === 'SILVER' || typeUpper === 'XAG') {
          endpoint = '/api/silver/price';
        } else if (typeUpper === 'PLATINUM') {
          endpoint = '/api/platinum/price';
        } else if (typeUpper === 'PALLADIUM') {
          endpoint = '/api/palladium/price';
        }
        // Check for crypto
        else if (['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'BNB']
          .some(c => typeUpper.includes(c) || typeUpper.startsWith(c))) {
          endpoint = `/api/crypto/price?symbol=${symbol}`;
        }
        // Default to stocks
        else {
          endpoint = `/api/stocks/price?symbol=${symbol}`;
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}${endpoint}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            return {
              symbol,
              price: data.data.price,
              change: data.data.change || 0,
              changePercent: data.data.changePercent || 0,
              currency: data.data.currency || 'USD',
              lastUpdate: Date.now()
            };
          }
        }
      } catch (error) {
        console.error(`[BatchPrice] Failed to fetch ${symbol}:`, error);
      }
      return null;
    });

    const results = await Promise.all(pricePromises);
    const priceMap: Record<string, any> = {};

    results.forEach(result => {
      if (result) {
        priceMap[result.symbol] = result;
      }
    });

    return NextResponse.json({ success: true, data: priceMap });
  } catch (error) {
    console.error('[BatchPrice] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) || [];

  if (symbols.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No symbols provided' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  return POST(request);
}
