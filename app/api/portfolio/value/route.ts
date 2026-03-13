import { NextRequest, NextResponse } from 'next/server';
import { getPrice as getRealtimePrice } from '@/lib/api/realtime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PositionRequest {
  symbol: string;
  type: string;
  quantity: number;
  averageBuyPrice: number;
  currency: string;
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

// Helper to fetch price from internal API using absolute URL
async function fetchPrice(symbol: string, type: string): Promise<{ success: boolean; data?: PriceData }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let endpoint = '';
  const typeUpper = type.toUpperCase();

  if (typeUpper === 'GOLD') {
    endpoint = `${baseUrl}/api/gold/price`;
  } else if (typeUpper === 'SILVER') {
    endpoint = `${baseUrl}/api/silver/price`;
  } else if (typeUpper === 'PLATINUM') {
    endpoint = `${baseUrl}/api/platinum/price`;
  } else if (typeUpper === 'PALLADIUM') {
    endpoint = `${baseUrl}/api/palladium/price`;
  } else if (typeUpper === 'CRYPTO') {
    endpoint = `${baseUrl}/api/crypto/price?symbol=${symbol}`;
  } else {
    endpoint = `${baseUrl}/api/stocks/price?symbol=${symbol}`;
  }

  const response = await fetch(endpoint, {
    // Add cache control to ensure fresh data
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    return { success: false };
  }

  const result = await response.json();

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        price: result.data.price,
        change: result.data.change || 0,
        changePercent: result.data.changePercent || 0,
        currency: result.data.currency || 'USD',
      },
    };
  }

  return { success: false };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const positions: PositionRequest[] = body.positions || [];

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid positions data',
        },
        { status: 400 }
      );
    }

    console.log(`[PortfolioValue] Calculating value for ${positions.length} positions`);

    const enrichedPositions = [];

    for (const position of positions) {
      try {
        // Fetch current price using the helper function
        const priceResult = await fetchPrice(position.symbol, position.type);

        let currentPrice = position.averageBuyPrice; // Fallback to buy price
        let change = 0;
        let changePercent = 0;
        let priceCurrency = position.currency; // Default to position's currency

        if (priceResult.success && priceResult.data) {
          currentPrice = priceResult.data.price;
          change = priceResult.data.change;
          changePercent = priceResult.data.changePercent;
          priceCurrency = priceResult.data.currency;
          console.log(`[PortfolioValue] ${position.symbol}: ${currentPrice} ${priceCurrency} (change: ${changePercent.toFixed(2)}%)`);
        } else {
          console.warn(`[PortfolioValue] Failed to fetch price for ${position.symbol}`);
        }

        // All values are kept in their respective currencies for frontend to handle conversion
        const costBasis = position.averageBuyPrice * position.quantity;
        const currentValue = currentPrice * position.quantity;
        const profitLoss = currentValue - costBasis;
        const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

        // NOTE: We don't sum totalValue/totalCost here anymore because they're in different currencies
        // The frontend will handle conversion and summation

        enrichedPositions.push({
          ...position,
          currentPrice,
          change,
          changePercent,
          priceCurrency, // The actual currency of the current price
          costBasis,
          currentValue,
          profitLoss,
          profitLossPercent,
        });
      } catch (error) {
        console.error(`[PortfolioValue] Error fetching price for ${position.symbol}:`, error);
        // Add position with fallback values
        const costBasis = position.averageBuyPrice * position.quantity;
        enrichedPositions.push({
          ...position,
          currentPrice: position.averageBuyPrice,
          change: 0,
          changePercent: 0,
          priceCurrency: position.currency,
          costBasis,
          currentValue: costBasis,
          profitLoss: 0,
          profitLossPercent: 0,
        });
      }
    }

    console.log(`[PortfolioValue] Processed ${enrichedPositions.length} positions`);
    console.log(`[PortfolioValue] Note: Totals calculated by frontend due to mixed currencies`);

    return NextResponse.json({
      success: true,
      data: {
        positions: enrichedPositions,
        lastUpdate: new Date().toISOString(),
        // Deprecated: These totals are not calculated server-side for mixed currencies
        totalValue: 0,
        totalCost: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
      },
    });
  } catch (error) {
    console.error('[PortfolioValue] Error calculating portfolio value:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate portfolio value',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick portfolio summary (requires positions in query)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const positionsParam = searchParams.get('positions');

    if (!positionsParam) {
      return NextResponse.json({
        success: false,
        error: 'Missing positions parameter',
      });
    }

    const positions: PositionRequest[] = JSON.parse(positionsParam);

    // Reuse POST logic
    const mockRequest = new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({ positions }),
    });

    return POST(mockRequest as any);
  } catch (error) {
    console.error('[PortfolioValue] Error in GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid positions parameter',
      },
      { status: 400 }
    );
  }
}
