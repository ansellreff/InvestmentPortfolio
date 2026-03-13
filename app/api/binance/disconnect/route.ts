import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    // Check if connection exists
    const connection = await prisma.binanceConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'No Binance connection found' },
        { status: 404 }
      );
    }

    // Delete all Binance assets for this user
    await prisma.binanceAsset.deleteMany({
      where: { userId },
    });

    // Delete the connection
    await prisma.binanceConnection.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Binance account disconnected successfully',
    });
  } catch (error) {
    console.error('[BinanceDisconnect] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect Binance account',
      },
      { status: 500 }
    );
  }
}
