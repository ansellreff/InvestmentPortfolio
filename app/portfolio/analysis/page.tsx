'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { usePortfolioStore, Position } from '@/stores/usePortfolioStore';
import { useCurrency } from '@/hooks/useCurrency';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface EnrichedPosition extends Position {
  currentPrice?: number;
  currentValue?: number;
  priceCurrency?: string; // The actual currency of the current price
  costBasis?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  dayChange?: number;
  dayChangePercent?: number;
}

interface CategoryBreakdown {
  category: string;
  value: number;
  cost: number;
  profitLoss: number;
  profitLossPercent: number;
  count: number;
  allocation: number;
  color: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const COLORS = {
  GOLD: '#F59E0B',
  SILVER: '#94A3B8',
  PLATINUM: '#8B5CF6',
  PALLADIUM: '#14B8A6',
  CRYPTO: '#8B5CF6',
  STOCK: '#3B82F6',
};

const CATEGORY_COLORS = {
  GOLD: '#F59E0B',
  SILVER: '#94A3B8',
  PLATINUM: '#8B5CF6',
  PALLADIUM: '#14B8A6',
  CRYPTO: '#A855F7',
  STOCK: '#3B82F6',
};

export default function PortfolioAnalysisPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { formatPrice, convertPrice, targetCurrency } = useCurrency();
  const { positions, initializePortfolio } = usePortfolioStore();

  const [enrichedPositions, setEnrichedPositions] = useState<EnrichedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Initialize portfolio
  useEffect(() => {
    if (status === 'authenticated') {
      initializePortfolio();
    }
  }, [status, initializePortfolio]);

  // Fetch portfolio values
  const fetchPortfolioValues = async () => {
    if (positions.length === 0) {
      setEnrichedPositions([]);
      setLoading(false);
      return;
    }

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
        // Fallback
        setEnrichedPositions(
          positions.map((p) => ({
            ...p,
            currentPrice: p.averageBuyPrice,
            priceCurrency: p.currency,
            currentValue: p.averageBuyPrice * p.quantity,
            costBasis: p.averageBuyPrice * p.quantity,
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolioValues();
    setRefreshing(false);
  };

  // Calculate category breakdown
  const categoryBreakdown = (): CategoryBreakdown[] => {
    const categories = ['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'CRYPTO', 'STOCK'];

    // First, calculate total portfolio value in targetCurrency
    const totalValue = enrichedPositions.reduce((sum, p) => {
      const converted = convertPrice(p.currentValue || 0, p.priceCurrency || p.currency);
      return sum + converted.price;
    }, 0);

    return categories.map((cat) => {
      const catPositions = enrichedPositions.filter((p) => p.type === cat);

      // Convert each position's value to targetCurrency before summing
      const value = catPositions.reduce((sum, p) => {
        const converted = convertPrice(p.currentValue || 0, p.priceCurrency || p.currency);
        return sum + converted.price;
      }, 0);

      // Convert each position's cost to targetCurrency before summing
      const cost = catPositions.reduce((sum, p) => {
        const converted = convertPrice(p.costBasis || 0, p.currency);
        return sum + converted.price;
      }, 0);

      const profitLoss = value - cost;
      const profitLossPercent = cost > 0 ? (profitLoss / cost) * 100 : 0;

      return {
        category: cat,
        value,
        cost,
        profitLoss,
        profitLossPercent,
        count: catPositions.length,
        allocation: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
      };
    }).filter((c) => c.count > 0);
  };

  const breakdown = categoryBreakdown();

  // Calculate portfolio metrics (convert each position to targetCurrency first)
  const totalValue = enrichedPositions.reduce((sum, p) => {
    const converted = convertPrice(p.currentValue || 0, p.priceCurrency || p.currency);
    return sum + converted.price;
  }, 0);

  const totalCost = enrichedPositions.reduce((sum, p) => {
    const converted = convertPrice(p.costBasis || 0, p.currency);
    return sum + converted.price;
  }, 0);

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  // Top performers
  const topPerformers = [...enrichedPositions]
    .sort((a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0))
    .slice(0, 5);

  // Worst performers
  const worstPerformers = [...enrichedPositions]
    .sort((a, b) => (a.profitLossPercent || 0) - (b.profitLossPercent || 0))
    .slice(0, 5);

  // Largest positions
  const largestPositions = [...enrichedPositions]
    .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
    .slice(0, 5);

  // Performance metrics
  const metrics: PerformanceMetric[] = [
    { label: 'Total Value', value: formatPrice(totalValue, targetCurrency) },
    { label: 'Total Cost', value: formatPrice(totalCost, targetCurrency) },
    {
      label: 'Total P&L',
      value: formatPrice(Math.abs(totalProfitLoss), targetCurrency),
      change: `${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLossPercent.toFixed(2)}%`,
      positive: totalProfitLoss >= 0,
    },
    { label: 'Total Positions', value: positions.length.toString() },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading portfolio analysis...</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto p-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-2xl font-bold mb-2">No Portfolio Data</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Add positions to your portfolio to see detailed analysis
            </p>
            <Button onClick={() => router.push('/portfolio')}>
              Go to Portfolio
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Prepare chart data
  const pieData = breakdown.map((b) => ({
    name: b.category,
    value: b.value,
    color: b.color,
  }));

  const barData = breakdown.map((b) => ({
    category: b.category,
    Value: b.value,
    Cost: b.cost,
    'P&L': b.profitLoss,
    pnlColor: b.profitLoss >= 0 ? '#22C55E' : '#EF4444',
  }));

  const performanceData = enrichedPositions.map((p) => ({
    symbol: p.symbol,
    Value: p.currentValue || 0,
    Cost: p.costBasis || 0,
    'P&L %': p.profitLossPercent || 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-purple-600" />
              Portfolio Analysis
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive analysis of your investment portfolio
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => (
            <Card key={idx} className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
              <p className="text-2xl font-bold mt-1">{metric.value}</p>
              {metric.change && (
                <p className={`text-sm font-medium ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Main Analysis Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Allocation Pie Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  Asset Allocation
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => formatPrice(value ?? 0, targetCurrency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Category Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Category Breakdown
                </h3>
                <div className="space-y-4">
                  {breakdown.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.category}</span>
                          <Badge variant="secondary">{cat.count}</Badge>
                        </div>
                        <span className="text-sm">{cat.allocation.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${cat.allocation}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{formatPrice(cat.value, targetCurrency)}</span>
                        <span className={cat.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {cat.profitLossPercent >= 0 ? '+' : ''}{cat.profitLossPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Value vs Cost Bar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Value vs Cost by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => formatPrice(value ?? 0, targetCurrency)}
                  />
                  <Legend />
                  <Bar dataKey="Value" fill="#3B82F6" />
                  <Bar dataKey="Cost" fill="#94A3B8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Detailed Allocation Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Positions</th>
                      <th className="text-right p-3">Value</th>
                      <th className="text-right p-3">Allocation</th>
                      <th className="text-right p-3">P&L</th>
                      <th className="text-right p-3">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((cat) => (
                      <tr key={cat.category} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.category}
                          </div>
                        </td>
                        <td className="text-right p-3">{cat.count}</td>
                        <td className="text-right p-3">{formatPrice(cat.value, targetCurrency)}</td>
                        <td className="text-right p-3">{cat.allocation.toFixed(2)}%</td>
                        <td className={`text-right p-3 ${cat.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(cat.profitLoss, targetCurrency)}
                        </td>
                        <td className={`text-right p-3 ${cat.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cat.profitLossPercent >= 0 ? '+' : ''}{cat.profitLossPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Profit/Loss by Category */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Profit & Loss by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => formatPrice(value ?? 0, targetCurrency)}
                  />
                  <Legend />
                  <Bar
                    dataKey="P&L"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {topPerformers.map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{pos.symbol}</p>
                        <p className="text-xs text-slate-500">{pos.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {pos.profitLossPercent !== undefined && pos.profitLossPercent >= 0 ? '+' : ''}{(pos.profitLossPercent || 0).toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-500">{formatPrice(pos.currentValue || 0, pos.priceCurrency || pos.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Worst Performers */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                  Worst Performers
                </h3>
                <div className="space-y-3">
                  {worstPerformers.map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{pos.symbol}</p>
                        <p className="text-xs text-slate-500">{pos.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {pos.profitLossPercent !== undefined && pos.profitLossPercent < 0 ? '' : '+'}{(pos.profitLossPercent || 0).toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-500">{formatPrice(pos.currentValue || 0, pos.priceCurrency || pos.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Performance by Position */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Performance by Position</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="symbol" type="category" width={100} />
                  <Tooltip
                    formatter={(value: number | undefined, name?: string) => {
                      if (name === 'P&L %') return `${((value ?? 0)).toFixed(2)}%`;
                      return formatPrice(value ?? 0, targetCurrency);
                    }}
                  />
                  <Legend />
                  <Bar dataKey="P&L %" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            {/* Largest Positions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Largest Positions by Value
              </h3>
              <div className="space-y-3">
                {largestPositions.map((pos, idx) => (
                  <div key={pos.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-400">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{pos.symbol}</p>
                          <p className="text-xs text-slate-500">{pos.quantity} shares</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(pos.currentValue || 0, pos.priceCurrency || pos.currency)}</p>
                        <p className={`text-xs ${(pos.profitLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(pos.profitLossPercent || 0) >= 0 ? '+' : ''}{(pos.profitLossPercent || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${totalValue > 0 ? ((pos.currentValue || 0) / totalValue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* All Positions Table */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">All Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Symbol</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-right p-3">Avg Price</th>
                      <th className="text-right p-3">Current Value</th>
                      <th className="text-right p-3">P&L</th>
                      <th className="text-right p-3">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedPositions.map((pos) => (
                      <tr key={pos.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-3">
                          <p className="font-semibold">{pos.symbol}</p>
                          <p className="text-xs text-slate-500">{pos.name}</p>
                        </td>
                        <td className="p-3">
                          <Badge
                            style={{
                              backgroundColor: COLORS[pos.type] + '20',
                              color: COLORS[pos.type],
                            }}
                          >
                            {pos.type}
                          </Badge>
                        </td>
                        <td className="text-right p-3">{pos.quantity}</td>
                        <td className="text-right p-3">{formatPrice(pos.averageBuyPrice, pos.currency)}</td>
                        <td className="text-right p-3 font-semibold">
                          {formatPrice(pos.currentValue || 0, pos.priceCurrency || pos.currency)}
                        </td>
                        <td className={`text-right p-3 ${(pos.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(pos.profitLoss || 0, targetCurrency)}
                        </td>
                        <td className={`text-right p-3 ${(pos.profitLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(pos.profitLossPercent || 0) >= 0 ? '+' : ''}{(pos.profitLossPercent || 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
