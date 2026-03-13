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

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    if (isNaN(year)) {
      return NextResponse.json(
        { success: false, error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Fetch dividends for the specified year
    const dividends = await prisma.dividend.findMany({
      where: {
        userId: session.user.id,
        exDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalAmount = dividends.reduce((sum, d) => sum + d.amount, 0);

    // Group by symbol
    const bySymbol = dividends.reduce((acc, d) => {
      acc[d.symbol] = (acc[d.symbol] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    // Get user's portfolio for yield calculation
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    // Calculate approximate portfolio value (using cost basis as proxy)
    const portfolioValue = portfolio.reduce((sum, p) => {
      return sum + (p.quantity * p.avgBuyPrice);
    }, 0);

    const annualYield = portfolioValue > 0 ? (totalAmount / portfolioValue) * 100 : 0;

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const monthDividends = dividends.filter(d => {
        const month = new Date(d.exDate).getMonth();
        return month === i;
      });
      return {
        month: i + 1,
        monthName: new Date(year, i).toLocaleString('default', { month: 'short' }),
        amount: monthDividends.reduce((sum, d) => sum + d.amount, 0),
      };
    });

    // Project next year (simplified - based on this year's average with 5% growth assumption)
    const avgMonthlyIncome = totalAmount / 12;
    const projectedAnnual = totalAmount > 0 ? totalAmount * 1.05 : 0;

    return NextResponse.json({
      success: true,
      data: {
        year,
        totalAmount,
        bySymbol,
        portfolioValue,
        annualYield,
        monthlyBreakdown,
        projectedAnnual,
        dividendCount: dividends.length,
      },
    });
  } catch (error) {
    console.error('[DividendsSummaryAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dividend summary' },
      { status: 500 }
    );
  }
}
