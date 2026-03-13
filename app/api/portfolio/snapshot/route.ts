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

    // Fetch current portfolio value
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
    });

    let totalValue = 0;
    let totalCost = 0;

    for (const position of portfolios) {
      totalValue += position.quantity * position.avgBuyPrice;
      totalCost += position.quantity * position.avgBuyPrice;
    }

    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Create snapshot
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId,
        totalValue,
        totalCost,
        totalPnL,
        totalPnLPercent,
        assetCount: portfolios.length,
      },
    });

    // Clean up old snapshots (keep last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    await prisma.portfolioSnapshot.deleteMany({
      where: {
        userId,
        timestamp: { lt: oneYearAgo },
      },
    });

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('[PortfolioSnapshot] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create snapshot',
      },
      { status: 500 }
    );
  }
}

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

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('[PortfolioSnapshot] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch snapshots',
      },
      { status: 500 }
    );
  }
}
