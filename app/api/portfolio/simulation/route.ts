import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Position {
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  quantity: number;
  averageBuyPrice: number;
  currency: string;
  addedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { positions } = await request.json();

    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: positions array required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(positions.map(async (position: Position) => {
      const addedDate = new Date(position.addedAt);
      const today = new Date();
      const daysSinceAdded = Math.max(30, Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Determine API endpoint based on type
      let endpoint: string;

      switch (position.type) {
        case 'GOLD':
          endpoint = `/api/gold/history?days=${daysSinceAdded}`;
          break;
        case 'SILVER':
          endpoint = `/api/silver/history?days=${daysSinceAdded}`;
          break;
        case 'PLATINUM':
          endpoint = `/api/platinum/history?days=${daysSinceAdded}`;
          break;
        case 'PALLADIUM':
          endpoint = `/api/palladium/history?days=${daysSinceAdded}`;
          break;
        case 'CRYPTO':
          endpoint = `/api/crypto/history?symbol=${position.symbol}&days=${daysSinceAdded}`;
          break;
        case 'STOCK':
        default:
          endpoint = `/api/stocks/history?symbol=${position.symbol}&days=${daysSinceAdded}`;
          break;
      }

      try {
        const response = await fetch(endpoint);
        const result = await response.json();

        const historicalData = result.success && result.data
          ? (result.data.historicalData || [])
          : [];

        return {
          symbol: position.symbol,
          name: position.name,
          type: position.type,
          quantity: position.quantity,
          avgBuyPrice: position.averageBuyPrice,
          currency: position.currency,
          investmentAmount: position.quantity * position.averageBuyPrice,
          addedAt: position.addedAt,
          historicalData,
          success: result.success,
        };
      } catch (error) {
        console.error(`[PortfolioSimulation] Error fetching data for ${position.symbol}:`, error);
        return {
          symbol: position.symbol,
          name: position.name,
          type: position.type,
          quantity: position.quantity,
          avgBuyPrice: position.averageBuyPrice,
          currency: position.currency,
          investmentAmount: position.quantity * position.averageBuyPrice,
          addedAt: position.addedAt,
          historicalData: [],
          success: false,
        };
      }
    }));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[PortfolioSimulation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio simulation data',
      },
      { status: 500 }
    );
  }
}
