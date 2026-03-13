'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioStore, Position } from '@/stores/usePortfolioStore';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { PositionTable } from '@/components/portfolio/PositionTable';
import { AddPositionForm } from '@/components/portfolio/AddPositionForm';
import { AllocationChart } from '@/components/portfolio/AllocationChart';
import { PerformanceChart } from '@/components/portfolio/PerformanceChart';
import { MetricsCard } from '@/components/portfolio/MetricsCard';
import { BinanceAssets } from '@/components/binance/BinanceAssets';
import { DividendTracker } from '@/components/portfolio/DividendTracker';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { TrendingUp, Wallet, Plus, RefreshCw, PieChart as PieChartIcon, Trash2, Edit3, CheckCircle, Cloud, CloudOff, AlertCircle, Loader2, PieChart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EnrichedPosition extends Position {
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  priceCurrency?: string; // The actual currency of the current price
  costBasis?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

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

export default function PortfolioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { formatPrice: formatPriceInCurrency, convertPrice, formatPriceRaw, targetCurrency } = useCurrency();
  const {
    positions,
    addPosition,
    updatePosition,
    removePosition,
    clearPositions,
    getTotalCostBasis,
    initializePortfolio,
    addPositionWithSync,
    updatePositionWithSync,
    removePositionWithSync,
    syncState,
    lastSyncTime,
  } = usePortfolioStore();

  const [enrichedPositions, setEnrichedPositions] = useState<EnrichedPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Auth guard - redirect to signin if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Initialize portfolio from database on mount
  useEffect(() => {
    if (status === 'authenticated' && !lastSyncTime) {
      initializePortfolio();
    }
  }, [status, lastSyncTime, initializePortfolio]);

  // Fetch live prices for all positions
  const fetchPortfolioValues = async () => {
    if (positions.length === 0) {
      setEnrichedPositions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/portfolio/value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      });

      const result = await response.json();

      if (result.success) {
        setEnrichedPositions(result.data.positions);
      } else {
        console.error('Failed to fetch portfolio values:', result.error);
        // Fallback to using cost basis
        setEnrichedPositions(
          positions.map((p) => ({
            ...p,
            currentPrice: p.averageBuyPrice,
            change: 0,
            changePercent: 0,
            priceCurrency: p.currency,
            costBasis: p.averageBuyPrice * p.quantity,
            currentValue: p.averageBuyPrice * p.quantity,
            profitLoss: 0,
            profitLossPercent: 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching portfolio values:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioValues();
  }, [positions]);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    if (positions.length === 0) {
      setPerformanceData(null);
      return;
    }

    setPerformanceLoading(true);
    try {
      const response = await fetch('/api/portfolio/performance');
      const result = await response.json();

      if (result.success) {
        setPerformanceData(result.data);
      } else {
        console.error('Failed to fetch performance data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [positions]);

  const handleAddPosition = async (data: Omit<Position, 'id' | 'addedAt'>) => {
    const success = await addPositionWithSync(data);
    if (success) {
      setShowAddForm(false);
    } else {
      alert('Failed to add position. Please try again.');
    }
  };

  const handleUpdatePosition = async (id: string, updates: Partial<Omit<Position, 'id'>>) => {
    const position = positions.find(p => p.id === id);
    if (!position) return;

    const success = await updatePositionWithSync(position.symbol, updates);
    if (success) {
      setEditingPosition(null);
    } else {
      alert('Failed to update position. Please try again.');
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (confirm('Are you sure you want to remove this position from your portfolio?')) {
      const position = positions.find(p => p.id === id);
      if (!position) return;

      const success = await removePositionWithSync(position.symbol);
      if (!success) {
        alert('Failed to delete position. Please try again.');
      }
    }
  };

  const handleEditClick = (position: Position) => {
    setEditingPosition(position);
    setShowAddForm(true);
  };

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats with currency conversion
  // Use useMemo to recalculate when enrichedPositions or targetCurrency changes
  const summaryData = useMemo(() => {
    if (enrichedPositions.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
      };
    }

    // Convert each position's value to targetCurrency before summing
    const totalValue = enrichedPositions.reduce((sum, p) => {
      const converted = convertPrice(p.currentValue || 0, p.priceCurrency || p.currency);
      return sum + converted.price;
    }, 0);

    const totalCost = enrichedPositions.reduce((sum, p) => {
      const converted = convertPrice(p.costBasis || 0, p.currency);
      return sum + converted.price;
    }, 0);

    const totalProfitLoss = enrichedPositions.reduce((sum, p) => {
      const converted = convertPrice(p.profitLoss || 0, p.priceCurrency || p.currency);
      return sum + converted.price;
    }, 0);

    const totalCostBasisForPercent = enrichedPositions.reduce((sum, p) => {
      const converted = convertPrice(p.costBasis || 0, p.currency);
      return sum + converted.price;
    }, 0);

    const totalProfitLossPercent = totalCostBasisForPercent > 0
      ? (totalProfitLoss / totalCostBasisForPercent) * 100
      : 0;

    return {
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercent,
    };
  }, [enrichedPositions, targetCurrency, convertPrice]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <Navigation onRefresh={fetchPortfolioValues} refreshing={loading} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-7 w-7 text-purple-600" />
              Investment Portfolio
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-600 dark:text-slate-400">
                Track your investments and monitor performance
              </p>
              {/* Sync Status Indicator */}
              <span className="flex items-center gap-1 text-xs">
                {syncState === 'syncing' && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing...
                  </span>
                )}
                {syncState === 'success' && lastSyncTime && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Cloud className="h-3 w-3" />
                    Saved
                  </span>
                )}
                {syncState === 'error' && (
                  <span className="flex items-center gap-1 text-red-600" title="Sync failed - data saved locally">
                    <CloudOff className="h-3 w-3" />
                    <AlertCircle className="h-3 w-3" />
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {positions.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href="/simulate?portfolio=true">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Simulate Portfolio
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all positions from your portfolio?')) {
                      clearPositions();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href="/portfolio/analysis">
                    <PieChart className="h-4 w-4 mr-2" />
                    Analysis
                  </a>
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </div>
        </div>
        <Tabs defaultValue="holdings" className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="dividends">Dividends</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-6">
            {positions.length === 0 && !showAddForm ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Start Building Your Portfolio</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Add your investment positions to track performance and monitor gains
              </p>
              <Button size="lg" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Position
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Portfolio Summary */}
            <PortfolioSummary
              totalValue={summaryData.totalValue}
              totalCost={summaryData.totalCost}
              totalProfitLoss={summaryData.totalProfitLoss}
              totalProfitLossPercent={summaryData.totalProfitLossPercent}
              positionCount={positions.length}
              loading={loading}
            />

            {/* Performance Analytics */}
            {positions.length > 0 && (
              <div className="space-y-6">
                {/* Performance Chart */}
                {performanceData && performanceData.history.length > 0 ? (
                  <PerformanceChart
                    data={performanceData.history}
                    currency="USD"
                    height={350}
                  />
                ) : performanceLoading ? (
                  <Card className="p-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      <span className="ml-2 text-slate-600 dark:text-slate-400">Loading performance data...</span>
                    </div>
                  </Card>
                ) : null}

                {/* Performance Metrics */}
                {performanceData && (
                  <MetricsCard
                    metrics={performanceData}
                    currency="USD"
                  />
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main content - Positions Table */}
              <div className="lg:col-span-2 space-y-6">
                <PositionTable
                  positions={enrichedPositions}
                  onEdit={handleEditClick}
                  onDelete={handleDeletePosition}
                  loading={loading}
                />

                {/* Add/Edit Position Form */}
                {showAddForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{editingPosition ? 'Edit Position' : 'Add New Position'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingPosition(null);
                          }}
                        >
                          ×
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AddPositionForm
                        onSubmit={handleAddPosition}
                        onUpdate={handleUpdatePosition}
                        editPosition={editingPosition}
                        onCancel={() => {
                          setShowAddForm(false);
                          setEditingPosition(null);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Allocation Chart */}
              <div className="space-y-6">
                <AllocationChart positions={enrichedPositions} />

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Portfolio Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Positions</span>
                      <Badge variant="secondary">{positions.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Asset Types</span>
                      <Badge variant="secondary">
                        {new Set(positions.map((p) => p.type)).size}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-xs text-slate-500 mb-2">Asset Allocation</div>
                      <div className="space-y-2">
                        {['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'CRYPTO', 'STOCK'].map((type) => {
                          const typePositions = positions.filter((p) => p.type === type);
                          if (typePositions.length === 0) return null;
                          const typeValue = enrichedPositions
                            .filter((p) => p.type === type)
                            .reduce((sum, p) => sum + (p.currentValue || 0), 0);
                          const percentage = summaryData.totalValue > 0
                            ? (typeValue / summaryData.totalValue) * 100
                            : 0;
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{type}</span>
                                <span className="font-medium">{percentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Binance Assets */}
                <BinanceAssets />
              </div>
            </div>
          </>
            )}
          </TabsContent>

          <TabsContent value="dividends" className="space-y-6">
            <DividendTracker portfolioValue={summaryData.totalValue} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
