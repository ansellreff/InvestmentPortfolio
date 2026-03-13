import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch user's alerts
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
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const whereClause: any = { userId };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const alerts = await prisma.priceAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('[AlertsGET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}

// POST - Create new alert
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

    const { symbol, name, alertType, targetPrice, targetPercent } = body;

    if (!symbol || !name || !alertType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build condition string
    let condition = '';
    switch (alertType) {
      case 'ABOVE':
        condition = `price > ${targetPrice}`;
        break;
      case 'BELOW':
        condition = `price < ${targetPrice}`;
        break;
      case 'CHANGE_PERCENT':
        condition = `change > ${targetPercent}%`;
        break;
      case 'DAILY_HIGH':
        condition = 'price >= dailyHigh';
        break;
      case 'DAILY_LOW':
        condition = 'price <= dailyLow';
        break;
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        symbol,
        name,
        alertType,
        targetPrice: targetPrice || null,
        targetPercent: targetPercent || null,
        condition,
        isActive: true,
        triggered: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('[AlertsPOST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create alert',
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove alert
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID required' },
        { status: 400 }
      );
    }

    // Verify alert belongs to user
    const alert = await prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert || alert.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    await prisma.priceAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert deleted',
    });
  } catch (error) {
    console.error('[AlertsDELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete alert',
      },
      { status: 500 }
    );
  }
}
