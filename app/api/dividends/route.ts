import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch all dividends for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const year = searchParams.get('year');

    const where: any = { userId: session.user.id };
    if (symbol) where.symbol = symbol;
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        where.exDate = {
          gte: new Date(`${yearNum}-01-01`),
          lte: new Date(`${yearNum}-12-31`),
        };
      }
    }

    const dividends = await prisma.dividend.findMany({
      where,
      orderBy: { exDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: dividends });
  } catch (error) {
    console.error('[DividendsAPI] Error fetching dividends:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dividends' },
      { status: 500 }
    );
  }
}

// POST - Add dividend record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.symbol || !data.name || !data.amount || !data.exDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: symbol, name, amount, exDate' },
        { status: 400 }
      );
    }

    const dividend = await prisma.dividend.create({
      data: {
        userId: session.user.id,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        type: data.type || 'STOCK',
        amount: parseFloat(data.amount),
        currency: data.currency || 'USD',
        exDate: new Date(data.exDate),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        shares: parseFloat(data.shares) || 0,
        perShare: parseFloat(data.perShare) || 0,
        notes: data.notes,
      },
    });

    return NextResponse.json({ success: true, data: dividend });
  } catch (error) {
    console.error('[DividendsAPI] Error creating dividend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create dividend record' },
      { status: 500 }
    );
  }
}

// DELETE - Remove dividend record
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing dividend id' },
        { status: 400 }
      );
    }

    await prisma.dividend.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DividendsAPI] Error deleting dividend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete dividend' },
      { status: 500 }
    );
  }
}
