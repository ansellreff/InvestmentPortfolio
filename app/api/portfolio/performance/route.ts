import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  bestDay: { date: string; gain: number } | null;
  worstDay: { date: string; loss: number } | null;
  benchmarkComparison: {
    symbol: string;
    return: number;
    portfolioReturn: number;
    beatBenchmark: boolean;
  } | null;
  history: Array<{
    date: string;
    value: number;
  }>;
}

// Risk-free rate (approximate 10-year treasury yield)
const RISK_FREE_RATE = 0.045; // 4.5%

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

    // Fetch portfolio positions
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
    });

    if (portfolios.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalValue: 0,
          totalCost: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          cagr: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          volatility: 0,
          bestDay: null,
          worstDay: null,
          benchmarkComparison: null,
          history: [],
        },
      });
    }

    // Get historical snapshots
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: 365, // Last year of data
    });

    // Calculate current portfolio value
    let totalValue = 0;
    let totalCost = 0;

    for (const position of portfolios) {
      const currentValue = position.quantity * position.avgBuyPrice; // Simplified, should use current price
      totalValue += currentValue;
      totalCost += position.quantity * position.avgBuyPrice;
    }

    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Calculate CAGR
    let cagr = 0;
    if (snapshots.length >= 2) {
      const oldestSnapshot = snapshots[0];
      const newestSnapshot = snapshots[snapshots.length - 1];
      const years = Math.max((newestSnapshot.timestamp.getTime() - oldestSnapshot.timestamp.getTime()) / (365 * 24 * 60 * 60 * 1000), 0.01);

      if (years > 0 && oldestSnapshot.totalCost > 0) {
        const startValue = oldestSnapshot.totalValue;
        const endValue = newestSnapshot.totalValue;
        cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      }
    }

    // Calculate volatility (standard deviation of returns)
    let volatility = 0;
    if (snapshots.length > 1) {
      const returns: number[] = [];
      for (let i = 1; i < snapshots.length; i++) {
        const prevValue = snapshots[i - 1].totalValue;
        const currValue = snapshots[i].totalValue;
        if (prevValue > 0) {
          returns.push((currValue - prevValue) / prevValue);
        }
      }
      if (returns.length > 0) {
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        volatility = Math.sqrt(variance) * 100; // Annualized (simplified)
      }
    }

    // Calculate Sharpe Ratio
    let sharpeRatio = 0;
    if (volatility > 0) {
      // Portfolio return in excess of risk-free rate
      const portfolioReturn = totalPnLPercent / 100;
      sharpeRatio = ((portfolioReturn - RISK_FREE_RATE) / (volatility / 100)) * 100;
    }

    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = -Infinity;
    for (const snapshot of snapshots) {
      if (snapshot.totalValue > peak) {
        peak = snapshot.totalValue;
      }
      const drawdown = peak > 0 ? ((peak - snapshot.totalValue) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Find best and worst days
    let bestDay = null;
    let worstDay = null;
    let bestGain = 0;
    let worstLoss = 0;

    for (const snapshot of snapshots) {
      // Calculate daily PnL
      const pnl = snapshot.totalPnL;
      if (pnl > bestGain) {
        bestGain = pnl;
        bestDay = {
          date: snapshot.timestamp.toISOString().split('T')[0],
          gain: pnl,
        };
      }
      if (pnl < worstLoss) {
        worstLoss = pnl;
        worstDay = {
          date: snapshot.timestamp.toISOString().split('T')[0],
          loss: Math.abs(pnl),
        };
      }
    }

    // Benchmark comparison (using S&P 500 approximation)
    const benchmarkComparison = {
      symbol: 'SPY',
      return: 12.5, // Approximate annual S&P 500 return
      portfolioReturn: cagr,
      beatBenchmark: cagr > 12.5,
    };

    // Build history
    const history = snapshots.map((s) => ({
      date: s.timestamp.toISOString().split('T')[0],
      value: s.totalValue,
    }));

    const data: PerformanceMetrics = {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      cagr,
      sharpeRatio,
      maxDrawdown,
      volatility,
      bestDay,
      worstDay,
      benchmarkComparison,
      history,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[PortfolioPerformance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch performance data',
      },
      { status: 500 }
    );
  }
}
