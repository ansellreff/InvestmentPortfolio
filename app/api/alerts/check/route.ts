import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PriceData {
  symbol: string;
  price: number;
  changePercent?: number;
  dailyHigh?: number;
  dailyLow?: number;
}

// Helper function to get current price for a symbol
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    // Determine symbol type and fetch price accordingly
    if (symbol.includes('-') || symbol === 'BTC' || symbol === 'ETH' || symbol === 'SOL') {
      // Crypto - use CoinGecko or /api/price
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      const data = await response.json();
      return data.success ? data.data.price : null;
    } else {
      // Stock - use Finnhub or similar
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      const data = await response.json();
      return data.success ? data.data.price : null;
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// GET - Check all active alerts and trigger if conditions are met
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all active alerts for user
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        userId,
        isActive: true,
        triggered: false,
      },
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          checked: 0,
          triggered: [],
        },
      });
    }

    const triggeredAlerts: any[] = [];

    // Check each alert
    for (const alert of activeAlerts) {
      const currentPrice = await getCurrentPrice(alert.symbol);

      if (currentPrice === null) continue;

      let shouldTrigger = false;

      switch (alert.alertType) {
        case 'ABOVE':
          shouldTrigger = alert.targetPrice ? currentPrice > alert.targetPrice : false;
          break;
        case 'BELOW':
          shouldTrigger = alert.targetPrice ? currentPrice < alert.targetPrice : false;
          break;
        case 'CHANGE_PERCENT':
          // For percent change, we'd need historical data
          // For now, we'll use a simple approach
          // In production, you'd store the baseline price when alert is created
          break;
        case 'DAILY_HIGH':
          // Would need daily high data
          break;
        case 'DAILY_LOW':
          // Would need daily low data
          break;
      }

      if (shouldTrigger) {
        // Mark alert as triggered
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date(),
            isActive: false, // Auto-disable after triggering
          },
        });

        triggeredAlerts.push({
          id: alert.id,
          symbol: alert.symbol,
          name: alert.name,
          alertType: alert.alertType,
          targetPrice: alert.targetPrice,
          currentPrice,
          triggeredAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checked: activeAlerts.length,
        triggered: triggeredAlerts,
      },
    });
  } catch (error) {
    console.error('[AlertsCheck] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check alerts',
      },
      { status: 500 }
    );
  }
}

// POST - Manually trigger alert check for a specific symbol
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { symbol, price } = body;

    if (!symbol || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Symbol and price required' },
        { status: 400 }
      );
    }

    // Find all active alerts for this symbol
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId,
        symbol,
        isActive: true,
        triggered: false,
      },
    });

    const triggeredAlerts: any[] = [];

    for (const alert of alerts) {
      let shouldTrigger = false;

      switch (alert.alertType) {
        case 'ABOVE':
          shouldTrigger = alert.targetPrice ? price > alert.targetPrice : false;
          break;
        case 'BELOW':
          shouldTrigger = alert.targetPrice ? price < alert.targetPrice : false;
          break;
      }

      if (shouldTrigger) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date(),
            isActive: false,
          },
        });

        triggeredAlerts.push({
          id: alert.id,
          symbol: alert.symbol,
          name: alert.name,
          alertType: alert.alertType,
          targetPrice: alert.targetPrice,
          currentPrice: price,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checked: alerts.length,
        triggered: triggeredAlerts,
      },
    });
  } catch (error) {
    console.error('[AlertsCheckPOST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check alerts',
      },
      { status: 500 }
    );
  }
}
