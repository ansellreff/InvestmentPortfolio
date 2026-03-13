import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BinanceClient, BinanceEncryption } from '@/lib/api/binance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Get user's Binance connection
    const connection = await prisma.binanceConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.isActive) {
      return NextResponse.json(
        { success: false, error: 'No active Binance connection found' },
        { status: 404 }
      );
    }

    // Decrypt API keys
    const apiKey = BinanceEncryption.decrypt(connection.apiKey);
    const apiSecret = BinanceEncryption.decrypt(connection.apiSecret);

    // Create Binance client and fetch balances
    const client = new BinanceClient(apiKey, apiSecret, connection.testnet);
    const balances = await client.getBalancesWithUSDValue();

    // Filter out assets with zero value
    const nonZeroBalances = balances.filter((b) => b.total > 0);

    // Update or create BinanceAsset records
    for (const balance of nonZeroBalances) {
      const existingAsset = await prisma.binanceAsset.findUnique({
        where: {
          userId_asset: {
            userId,
            asset: balance.asset,
          },
        },
      });

      if (existingAsset) {
        await prisma.binanceAsset.update({
          where: { id: existingAsset.id },
          data: {
            free: balance.free,
            locked: balance.locked,
            valueUSD: balance.valueUSD || 0,
            lastUpdated: new Date(),
          },
        });
      } else {
        await prisma.binanceAsset.create({
          data: {
            userId,
            asset: balance.asset,
            free: balance.free,
            locked: balance.locked,
            valueUSD: balance.valueUSD || 0,
          },
        });
      }
    }

    // Remove assets that no longer exist in Binance
    const currentAssets = nonZeroBalances.map((b) => b.asset);
    await prisma.binanceAsset.deleteMany({
      where: {
        userId,
        asset: { notIn: currentAssets },
      },
    });

    // Update last sync time
    await prisma.binanceConnection.update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        synced: nonZeroBalances.length,
        assets: nonZeroBalances,
      },
    });
  } catch (error) {
    console.error('[BinanceSync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Binance assets',
      },
      { status: 500 }
    );
  }
}
