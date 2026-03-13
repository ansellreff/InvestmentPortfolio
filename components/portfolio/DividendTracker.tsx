'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Plus, Trash2, Edit2 } from 'lucide-react';
import { useDividendStore } from '@/stores/useDividendStore';
import { AddDividendForm } from './AddDividendForm';
import { useCurrency } from '@/hooks/useCurrency';

interface DividendTrackerProps {
  portfolioValue?: number;
}

export function DividendTracker({ portfolioValue = 0 }: DividendTrackerProps) {
  const { formatPrice } = useCurrency();
  const { summary, dividends, loadSummary, loadDividends, deleteDividend } = useDividendStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDividend, setEditingDividend] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDividends();
    loadSummary(selectedYear);
  }, [selectedYear]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this dividend record?')) {
      await deleteDividend(id);
      await loadSummary(selectedYear);
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading dividend data...</p>
        </div>
      </div>
    );
  }

  const hasDividends = dividends.length > 0 || summary.totalAmount > 0;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[-2, -1, 0, 1].map((offset) => {
            const year = new Date().getFullYear() + offset;
            return (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Dividend
        </Button>
      </div>

      {!hasDividends ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Track Your Dividend Income</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Add dividend records to track your investment income and portfolio yield
            </p>
            <Button size="lg" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Dividend
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Income in {selectedYear}</p>
                    <p className="text-2xl font-bold">{formatPrice(summary.totalAmount, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Portfolio Yield</p>
                    <p className="text-2xl font-bold">{summary.annualYield.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-slate-600">Projected {selectedYear + 1}</p>
                    <p className="text-2xl font-bold">{formatPrice(summary.projectedAnnual, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <span className="text-xs font-bold">{summary.dividendCount}</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Payments</p>
                    <p className="text-2xl font-bold">{summary.dividendCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {summary.monthlyBreakdown.map((month) => (
                  <div
                    key={month.month}
                    className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-400">{month.monthName}</p>
                    <p className={`text-sm font-semibold ${month.amount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      {month.amount > 0 ? formatPrice(month.amount, 'USD') : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income by Symbol */}
          <Card>
            <CardHeader>
              <CardTitle>Income by Position</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.bySymbol).length === 0 ? (
                <p className="text-center text-slate-500 py-4">No dividend income recorded for {selectedYear}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.bySymbol)
                    .sort(([, a], [, b]) => b - a)
                    .map(([symbol, amount]) => {
                      const percentage = summary.totalAmount > 0 ? (amount / summary.totalAmount) * 100 : 0;
                      return (
                        <div key={symbol} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{symbol}</span>
                            <span>{formatPrice(amount, 'USD')} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Dividends Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Dividend Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Symbol</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Ex-Date</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Amount</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Per Share</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Shares</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividends.slice(0, 10).map((dividend) => (
                      <tr key={dividend.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="py-3 px-3">
                          <div>
                            <p className="font-medium">{dividend.symbol}</p>
                            <p className="text-xs text-slate-500">{dividend.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {new Date(dividend.exDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-sm font-medium text-green-600">
                          {formatPrice(dividend.amount, dividend.currency)}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {formatPrice(dividend.perShare, dividend.currency)}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {dividend.shares.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDividend(dividend);
                              setShowAddForm(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dividend.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dividend Modal */}
      {showAddForm && (
        <AddDividendForm
          editDividend={editingDividend}
          onClose={() => {
            setShowAddForm(false);
            setEditingDividend(null);
          }}
          onSave={async () => {
            await loadDividends();
            await loadSummary(selectedYear);
            setShowAddForm(false);
            setEditingDividend(null);
          }}
        />
      )}
    </div>
  );
}
