'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { ProfessionalChart, OHLCVData, Timeframe, ChartType } from '@/components/charts/ProfessionalChart';
import { TimeframeSelector, timeframeToDays } from '@/components/charts/TimeframeSelector';
import { IndicatorControls, IndicatorConfig, getDefaultIndicators } from '@/components/charts/IndicatorControls';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { TrendingUp, BarChart3, Download, RefreshCw, Calendar, Zap, AlertCircle, DollarSign, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DetailedData {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  historicalData: Array<{ date: string; price: number; open?: number; high?: number; low?: number; close?: number; volume?: number }>;
  indicators: any;
  signal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    reasons: string[];
  };
  forecast: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    trendStrength: number;
    supportLevel: number;
    resistanceLevel: number;
    targetPrice: number;
    stopLoss: number;
    predictions: Array<{ date: string; price: number; confidence: number }>;
  };
}

export default function ComparePage() {
  const { selectedInstruments, clearInstruments } = useComparisonStore();
  const [detailedData, setDetailedData] = useState<DetailedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [viewMode, setViewMode] = useState<'overview' | 'analysis' | 'charts' | 'forecast'>('overview');
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(getDefaultIndicators());
  const [showIndicatorControls, setShowIndicatorControls] = useState(false);
  const { formatPrice: formatPriceInCurrency, convertPrice, targetCurrency } = useCurrency();

  // Fetch detailed data for all instruments
  const fetchDetailedData = async () => {
    setLoading(true);
    setError(null);
    const results: DetailedData[] = [];
    const days = timeframeToDays(timeframe);

    for (const instrument of selectedInstruments) {
      try {
        let endpoint = '';
        const type = instrument.type;

        if (type === 'GOLD') {
          endpoint = `/api/gold/history?days=${days}`;
        } else if (type === 'SILVER') {
          endpoint = `/api/silver/history?days=${days}`;
        } else if (type === 'PLATINUM') {
          endpoint = `/api/platinum/history?days=${days}`;
        } else if (type === 'PALLADIUM') {
          endpoint = `/api/palladium/history?days=${days}`;
        } else if (type === 'CRYPTO') {
          endpoint = `/api/crypto/history?symbol=${instrument.symbol}&days=${days}`;
        } else {
          endpoint = `/api/stocks/history?symbol=${instrument.symbol}&days=${days}`;
        }

        const response = await fetch(endpoint);
        const result = await response.json();
        if (result.success) {
          results.push(result.data);
        } else {
          console.error(`API error for ${instrument.symbol}:`, result.error);
        }
      } catch (err) {
        console.error(`Error fetching data for ${instrument.symbol}:`, err);
      }
    }

    setDetailedData(results);

    if (results.length === 0) {
      setError('Failed to load detailed analysis. Please try again.');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedInstruments.length > 0) {
      fetchDetailedData();
    } else {
      setDetailedData([]);
      setLoading(false);
    }
  }, [selectedInstruments, timeframe]);

  const handleExport = async () => {
    try {
      const dataToExport = detailedData.length > 0 ? detailedData.map(d => ({
        symbol: d.symbol,
        name: d.name,
        type: selectedInstruments.find(i => i.symbol === d.symbol)?.type || 'STOCK',
        price: d.currentPrice,
        currency: d.currency,
      })) : selectedInstruments;

      const headers = ['#', 'Symbol', 'Name', 'Type', 'Price', 'Currency'];
      const rows = dataToExport.map((item: any, idx: number) => [
        idx + 1,
        item.symbol,
        item.name,
        item.type,
        (item.price || 0).toFixed(2),
        item.currency || 'USD',
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investment-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Convert historical data to OHLCV format for ProfessionalChart
  const convertToOHLCV = (historicalData: DetailedData['historicalData']): OHLCVData[] => {
    return historicalData.map(d => ({
      time: Math.floor(new Date(d.date).getTime() / 1000),
      open: d.open ?? d.price,
      high: d.high ?? d.price,
      low: d.low ?? d.price,
      close: d.close ?? d.price,
      volume: d.volume,
    }));
  };

  // Show empty state if no instruments selected
  if (selectedInstruments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Instruments Selected</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Please select at least one instrument from the home page
              </p>
              <Button asChild>
                <a href="/">Go to Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const comparisonData = detailedData.length > 0 ? detailedData.map(d => {
    // Convert price from source currency to target currency for comparison chart
    const convertedPrice = convertPrice(d.currentPrice, d.currency || 'USD').price;
    const convertedForecast = d.forecast?.targetPrice
      ? convertPrice(d.forecast.targetPrice, d.currency || 'USD').price
      : 0;
    return {
      name: d.symbol,
      price: convertedPrice,
      forecast: convertedForecast,
    };
  }) : [];

  const signalDistribution = detailedData.length > 0 ? [
    { name: 'BUY', value: detailedData.filter(d => d.signal?.action === 'BUY').length, color: '#22c55e' },
    { name: 'HOLD', value: detailedData.filter(d => d.signal?.action === 'HOLD').length, color: '#eab308' },
    { name: 'SELL', value: detailedData.filter(d => d.signal?.action === 'SELL').length, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const riskReturnData = detailedData.length > 0 ? detailedData.map(d => {
    const returns = d.forecast ? ((d.forecast.targetPrice / d.currentPrice - 1) * 100) : 0;
    const risk = d.forecast ? (Math.abs(d.currentPrice - d.forecast.stopLoss) / d.currentPrice * 100) : 0;
    return { name: d.symbol, returns, risk };
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation onRefresh={fetchDetailedData} refreshing={loading} />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              Advanced Comparison
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {selectedInstruments.length} instrument{selectedInstruments.length > 1 ? 's' : ''} selected
              {detailedData.length > 0 && ` (${detailedData.length} analyzed)`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIndicatorControls(!showIndicatorControls)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Indicators
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap items-center">
          {(['overview', 'analysis', 'charts', 'forecast'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
              disabled={loading}
            >
              {mode === 'overview' && <BarChart3 className="h-4 w-4 mr-2" />}
              {mode === 'analysis' && <Zap className="h-4 w-4 mr-2" />}
              {mode === 'charts' && <TrendingUp className="h-4 w-4 mr-2" />}
              {mode === 'forecast' && <Calendar className="h-4 w-4 mr-2" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading analysis...</p>
          </div>
        ) : error ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Unable to Load Analysis</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={fetchDetailedData}>Try Again</Button>
                <Button variant="outline" asChild>
                  <a href="/">Go to Home</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : detailedData.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Selected Instruments</CardTitle>
              <CardDescription>Basic information (advanced analysis unavailable)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedInstruments.map((instrument) => (
                  <div
                    key={instrument.symbol}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{instrument.symbol}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{instrument.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {instrument.price && (
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                          {formatPriceInCurrency(instrument.price, instrument.currency || 'USD')}
                        </p>
                      )}
                      <Badge variant={instrument.type === 'GOLD' ? 'default' : 'secondary'}>
                        {instrument.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Advanced analysis features require historical data. Please make sure the API endpoints are working properly.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Indicator Controls Panel */}
            {showIndicatorControls && (
              <div className="mb-6">
                <IndicatorControls
                  config={indicatorConfig}
                  onChange={setIndicatorConfig}
                  collapsed={false}
                />
              </div>
            )}

            {/* Overview View */}
            {viewMode === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Total Instruments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{detailedData.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Buy Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {detailedData.filter(d => d.signal?.action === 'BUY').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Bullish Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {detailedData.filter(d => d.forecast?.trend === 'BULLISH').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Avg Target Return
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {detailedData.length > 0 && detailedData.every(d => d.forecast?.targetPrice)
                          ? `${(detailedData.reduce((sum, d) => sum + (d.forecast!.targetPrice / d.currentPrice - 1), 0) / detailedData.length * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Signal Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Signal Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {signalDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={signalDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {signalDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No signal data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Risk vs Return */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk vs Return</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskReturnData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={riskReturnData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value?: number) => value ? `${value.toFixed(2)}%` : '0.00%'} />
                            <Bar dataKey="returns" fill="#22c55e" name="Expected Return" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No risk/return data available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {detailedData.map((data) => (
                    <AnalysisCard
                      key={data.symbol}
                      symbol={data.symbol}
                      name={data.name}
                      currentPrice={data.currentPrice}
                      currency={data.currency}
                      signal={data.signal}
                      forecast={data.forecast}
                      indicators={data.indicators}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Analysis View */}
            {viewMode === 'analysis' && (
              <div className="grid gap-6 md:grid-cols-2">
                {detailedData.map((data) => (
                  <AnalysisCard
                    key={data.symbol}
                    symbol={data.symbol}
                    name={data.name}
                    currentPrice={data.currentPrice}
                    currency={data.currency}
                    signal={data.signal}
                    forecast={data.forecast}
                    indicators={data.indicators}
                  />
                ))}
              </div>
            )}

            {/* Charts View - Now with ProfessionalChart */}
            {viewMode === 'charts' && (
              <div className="space-y-6">
                {detailedData.map((data) => (
                  <Card key={data.symbol}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{data.symbol}</span>
                        <Badge variant={data.forecast?.trend === 'BULLISH' ? 'default' : data.forecast?.trend === 'BEARISH' ? 'destructive' : 'secondary'}>
                          {data.forecast?.trend || 'NEUTRAL'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfessionalChart
                        symbol={data.symbol}
                        name={data.name}
                        initialData={convertToOHLCV(data.historicalData || [])}
                        height={500}
                        currency={data.currency}
                        showVolume={true}
                        defaultChartType="candlestick"
                        defaultTimeframe={timeframe}
                        indicators={indicatorConfig}
                        onTimeframeChange={(tf) => setTimeframe(tf)}
                      />
                    </CardContent>
                  </Card>
                ))}

                {/* Price Comparison Chart */}
                {detailedData.length > 1 && comparisonData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Current Price" />
                          <Line type="monotone" dataKey="forecast" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" name="Target Price" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Forecast View - Now with ProfessionalChart */}
            {viewMode === 'forecast' && (
              <div className="space-y-6">
                {detailedData.map((data) => (
                  <Card key={data.symbol}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>30-Day Forecast: {data.symbol}</span>
                        {data.forecast && (
                          <Badge className={data.forecast.trend === 'BULLISH' ? 'bg-green-100 text-green-800' : data.forecast.trend === 'BEARISH' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {data.forecast.trend} ({data.forecast.trendStrength}% confidence)
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data.forecast ? (
                        <>
                          <div className="grid gap-4 md:grid-cols-4 mb-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Current</p>
                              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                {formatPriceInCurrency(data.currentPrice, data.currency || 'USD')}
                              </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Target</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatPriceInCurrency(data.forecast.targetPrice, data.currency || 'USD')}
                              </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Support</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatPriceInCurrency(data.forecast.supportLevel, data.currency || 'USD')}
                              </p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                              <p className="text-xs text-red-700 dark:text-red-300 font-medium">Resistance</p>
                              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                {formatPriceInCurrency(data.forecast.resistanceLevel, data.currency || 'USD')}
                              </p>
                            </div>
                          </div>

                          <ProfessionalChart
                            symbol={data.symbol}
                            name={data.name}
                            initialData={convertToOHLCV(data.historicalData || [])}
                            height={450}
                            currency={data.currency}
                            showVolume={true}
                            defaultChartType="candlestick"
                            defaultTimeframe={timeframe}
                            indicators={{
                              sma: indicatorConfig.sma,
                              ema: indicatorConfig.ema,
                              bollingerBands: true,
                            }}
                            onTimeframeChange={(tf) => setTimeframe(tf)}
                          />
                        </>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No forecast data available</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
