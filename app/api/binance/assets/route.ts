import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Get user's Binance connection status
    const connection = await prisma.binanceConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          assets: [],
        },
      });
    }

    // Get synced assets
    const assets = await prisma.binanceAsset.findMany({
      where: { userId },
      orderBy: { valueUSD: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        lastSyncAt: connection.lastSyncAt,
        testnet: connection.testnet,
        totalValueUSD: assets.reduce((sum, a) => sum + (a.valueUSD || 0), 0),
        assets: assets.map((a) => ({
          asset: a.asset,
          free: a.free,
          locked: a.locked,
          total: a.free + a.locked,
          valueUSD: a.valueUSD,
          lastUpdated: a.lastUpdated,
        })),
      },
    });
  } catch (error) {
    console.error('[BinanceAssets] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Binance assets',
      },
      { status: 500 }
    );
  }
}
