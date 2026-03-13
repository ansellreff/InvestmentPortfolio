'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positionCount: number;
  loading?: boolean;
}

export function PortfolioSummary({
  totalValue,
  totalCost,
  totalProfitLoss,
  totalProfitLossPercent,
  positionCount,
  loading = false,
}: PortfolioSummaryProps) {
  // Use formatPriceRaw since values are already converted to targetCurrency
  const { formatPriceRaw } = useCurrency();
  const isProfitable = totalProfitLoss >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Value</p>
              {loading ? (
                <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatPriceRaw(totalValue)}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Cost Basis */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Cost Basis</p>
              {loading ? (
                <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatPriceRaw(totalCost)}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-600 dark:text-slate-400">$</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit/Loss */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total P&L</p>
              {loading ? (
                <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
              ) : (
                <>
                  <p className={`text-2xl font-bold mt-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? '+' : ''}{formatPriceRaw(totalProfitLoss)}
                  </p>
                  <p className={`text-xs font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    ({isProfitable ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
                  </p>
                </>
              )}
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isProfitable ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}>
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Count */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Positions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {positionCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm font-bold">
                {positionCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
