'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfessionalChart, OHLCVData, Timeframe } from '@/components/charts/ProfessionalChart';
import { TimeframeSelector, timeframeToDays } from '@/components/charts/TimeframeSelector';
import { IndicatorControls, IndicatorConfig, getDefaultIndicators } from '@/components/charts/IndicatorControls';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { RefreshCw, TrendingUp, Activity, AlertCircle, BarChart3, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrencyStore } from '@/stores/useCurrencyStore';
import { generateForecast as libGenerateForecast } from '@/lib/analysis/forecasting';

interface AnalysisData {
  symbol: string;
  name: string;
  type: string;
  currentPrice: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  signals: Signal[];
  technicalIndicators: TechnicalIndicators;
  forecast: Forecast[];
  historicalData: any[];
}

interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: 'Strong' | 'Moderate' | 'Weak';
  reason: string;
  timeframe: string;
}

interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
}

interface Forecast {
  date: string;
  predictedPrice: number;
  confidence: number;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { currency } = useCurrencyStore();
  const { formatPrice: formatPriceInCurrency } = useCurrency();
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(getDefaultIndicators());
  const [showIndicatorControls, setShowIndicatorControls] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runAnalysis = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    try {
      const upperSymbol = symbol.toUpperCase();

      // Detect instrument type and use appropriate endpoint
      let type = 'STOCK';
      if (upperSymbol === 'GOLD' || upperSymbol === 'XAU') {
        type = 'GOLD';
      } else if (upperSymbol === 'SILVER' || upperSymbol === 'XAG') {
        type = 'SILVER';
      } else if (upperSymbol === 'PLATINUM' || upperSymbol === 'XPT') {
        type = 'PLATINUM';
      } else if (upperSymbol === 'PALLADIUM' || upperSymbol === 'XPD') {
        type = 'PALLADIUM';
      } else if (upperSymbol.includes('-USD') || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT'].some(c => upperSymbol.includes(c))) {
        type = 'CRYPTO';
      }

      // Determine endpoint and symbol
      let apiEndpoint = '';
      let apiSymbol = upperSymbol;

      if (type === 'GOLD') {
        apiEndpoint = `/api/gold/history?days=${timeframeToDays(timeframe)}`;
      } else if (type === 'SILVER') {
        apiEndpoint = `/api/silver/history?days=${timeframeToDays(timeframe)}`;
      } else if (type === 'PLATINUM') {
        apiEndpoint = `/api/platinum/history?days=${timeframeToDays(timeframe)}`;
      } else if (type === 'PALLADIUM') {
        apiEndpoint = `/api/palladium/history?days=${timeframeToDays(timeframe)}`;
      } else if (type === 'CRYPTO') {
        apiSymbol = upperSymbol.includes('-') ? upperSymbol : `${upperSymbol}-USD`;
        apiEndpoint = `/api/crypto/history?symbol=${apiSymbol}&days=${timeframeToDays(timeframe)}`;
      } else {
        apiSymbol = upperSymbol.includes('.') ? upperSymbol : `${upperSymbol}.JK`;
        apiEndpoint = `/api/stocks/history?symbol=${apiSymbol}&days=${timeframeToDays(timeframe)}`;
      }

      // Fetch historical data
      const historyResponse = await fetch(apiEndpoint);
      const historyResult = await historyResponse.json();

      if (historyResult.success) {
        const historicalData = historyResult.data.historicalData || [];
        const currentPrice = historyResult.data.currentPrice;
        const historicalPrices = historicalData.map((d: any) => d.price);

        if (historicalPrices.length < 2) {
          throw new Error('Insufficient data for analysis');
        }

        const previousPrice = historicalPrices[0]?.price || currentPrice;
        const change24h = currentPrice - previousPrice;
        const changePercent24h = (change24h / previousPrice) * 100;

        // Calculate technical indicators
        const rsi = calculateRSI(historicalPrices);
        const sma20 = calculateSMA(historicalPrices, 20);
        const sma50 = calculateSMA(historicalPrices, 50);
        const bollingerBands = calculateBollingerBands(historicalPrices, 20);

        // Generate signals
        const signals = generateSignals({
          price: currentPrice,
          rsi,
          sma20,
          sma50,
          changePercent24h,
        });

        // Use library forecast function
        const forecastResult = libGenerateForecast(historicalPrices, 30);
        const forecast = forecastResult.predictions.map((p: any) => ({
          date: p.date,
          predictedPrice: p.price,
          confidence: p.confidence,
        }));

        setAnalysisData({
          symbol: historyResult.data.symbol || upperSymbol,
          name: historyResult.data.name || upperSymbol,
          type,
          currentPrice,
          currency: historyResult.data.currency || 'USD',
          change24h,
          changePercent24h,
          signals,
          technicalIndicators: {
            rsi,
            macd: {
              value: 0,
              signal: 0,
              histogram: 0,
            },
            sma20,
            sma50,
            bollingerBands,
          },
          forecast,
          historicalData,
        });
      } else {
        throw new Error(historyResult.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      alert(error instanceof Error ? error.message : 'Failed to analyze. Please check the symbol and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!symbol.trim()) return;
    setRefreshing(true);
    await runAnalysis();
    setRefreshing(false);
  };

  // Calculate RSI
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // Calculate SMA
  const calculateSMA = (prices: number[], period: number): number => {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (prices: number[], period: number = 20) => {
    const sma = calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (2 * stdDev),
      middle: sma,
      lower: sma - (2 * stdDev),
    };
  };

  // Generate trading signals
  const generateSignals = (data: {
    price: number;
    rsi: number;
    sma20: number;
    sma50: number;
    changePercent24h: number;
  }): Signal[] => {
    const signals: Signal[] = [];

    // RSI Signal
    if (data.rsi < 30) {
      signals.push({
        type: 'BUY',
        strength: 'Strong',
        reason: `RSI is ${data.rsi.toFixed(2)} (oversold territory)`,
        timeframe: 'Short-term',
      });
    } else if (data.rsi > 70) {
      signals.push({
        type: 'SELL',
        strength: 'Strong',
        reason: `RSI is ${data.rsi.toFixed(2)} (overbought territory)`,
        timeframe: 'Short-term',
      });
    }

    // SMA Crossover
    if (data.sma20 > data.sma50) {
      signals.push({
        type: 'BUY',
        strength: 'Moderate',
        reason: 'SMA 20 is above SMA 50 (bullish trend)',
        timeframe: 'Medium-term',
      });
    } else if (data.sma20 < data.sma50) {
      signals.push({
        type: 'SELL',
        strength: 'Moderate',
        reason: 'SMA 20 is below SMA 50 (bearish trend)',
        timeframe: 'Medium-term',
      });
    }

    // Price momentum
    if (data.changePercent24h > 2) {
      signals.push({
        type: 'BUY',
        strength: 'Moderate',
        reason: `Strong upward momentum (${data.changePercent24h.toFixed(2)}% in period)`,
        timeframe: 'Short-term',
      });
    } else if (data.changePercent24h < -2) {
      signals.push({
        type: 'SELL',
        strength: 'Moderate',
        reason: `Strong downward momentum (${data.changePercent24h.toFixed(2)}% in period)`,
        timeframe: 'Short-term',
      });
    }

    // Default neutral signal
    if (signals.length === 0) {
      signals.push({
        type: 'HOLD',
        strength: 'Moderate',
        reason: 'No strong technical signals detected',
        timeframe: 'All',
      });
    }

    return signals;
  };

  // Convert historical data to OHLCV format
  const convertToOHLCV = (historicalData: any[]): OHLCVData[] => {
    return historicalData.map(d => ({
      time: Math.floor(new Date(d.date).getTime() / 1000),
      open: d.open ?? d.price,
      high: d.high ?? d.price,
      low: d.low ?? d.price,
      close: d.close ?? d.price,
      volume: d.volume,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Technical Analysis
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Professional charting, indicators, signals, and forecasting
          </p>
        </div>
        {/* Search Section */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Enter Symbol</Label>
              <Input
                placeholder="e.g., BBCA.JK, GOLD, BTC-USD, AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
                className="mt-2"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={runAnalysis} disabled={loading || !symbol} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={refreshing || !analysisData}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Quick examples:</span>
            {['GOLD', 'BBCA.JK', 'BTC-USD', 'AAPL'].map((example) => (
              <Button
                key={example}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setSymbol(example);
                  // Auto-run analysis if not already analyzing this
                  if (analysisData?.symbol !== example) {
                    setTimeout(() => runAnalysis(), 100);
                  }
                }}
              >
                {example}
              </Button>
            ))}
          </div>
        </Card>

        {analysisData && (
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

            <Tabs defaultValue="chart" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIndicatorControls(!showIndicatorControls)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Indicators
                </Button>
              </div>

              <TabsContent value="chart" className="space-y-6">
                {/* Professional Chart */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{analysisData.symbol}</h3>
                      <p className="text-sm text-slate-500">{analysisData.name}</p>
                    </div>
                    <Badge variant="outline">{analysisData.type}</Badge>
                  </div>
                  <TimeframeSelector value={timeframe} onChange={setTimeframe} className="mb-4" />
                  <ProfessionalChart
                    symbol={analysisData.symbol}
                    name={analysisData.name}
                    initialData={convertToOHLCV(analysisData.historicalData || [])}
                    height={500}
                    currency={analysisData.currency}
                    showVolume={true}
                    defaultChartType="candlestick"
                    defaultTimeframe={timeframe}
                    indicators={indicatorConfig}
                    onTimeframeChange={(tf) => setTimeframe(tf)}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Current Price</p>
                    <p className="text-2xl font-bold">
                      {formatPriceInCurrency(analysisData.currentPrice, analysisData.currency)}
                    </p>
                    <p className={`text-sm font-medium ${analysisData.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysisData.changePercent24h >= 0 ? '+' : ''}{analysisData.changePercent24h.toFixed(2)}%
                    </p>
                  </Card>

                  <Card className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">RSI</p>
                    <p className="text-2xl font-bold">{analysisData.technicalIndicators.rsi.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">
                      {analysisData.technicalIndicators.rsi < 30 ? 'Oversold' :
                       analysisData.technicalIndicators.rsi > 70 ? 'Overbought' : 'Neutral'}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">SMA 20/50</p>
                    <p className="text-2xl font-bold">
                      {analysisData.technicalIndicators.sma20.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      SMA 50: {analysisData.technicalIndicators.sma50.toFixed(2)}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Signal Strength</p>
                    <p className="text-2xl font-bold">
                      {analysisData.signals[0]?.type || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {analysisData.signals[0]?.strength || 'N/A'}
                    </p>
                  </Card>
                </div>

                {/* Trading Signals */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Trading Signals
                  </h3>
                  <div className="space-y-3">
                    {analysisData.signals.map((signal, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          signal.type === 'BUY' ? 'bg-green-50 border-green-500 dark:bg-green-950/20' :
                          signal.type === 'SELL' ? 'bg-red-50 border-red-500 dark:bg-red-950/20' :
                          'bg-slate-50 border-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={signal.type === 'BUY' ? 'default' : signal.type === 'SELL' ? 'destructive' : 'secondary'}
                              >
                                {signal.type}
                              </Badge>
                              <Badge variant="outline">{signal.strength}</Badge>
                              <span className="text-sm text-slate-500">{signal.timeframe}</span>
                            </div>
                            <p className="text-sm">{signal.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Price Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Price Chart</h3>
                  <ProfessionalChart
                    symbol={analysisData.symbol}
                    name={analysisData.name}
                    initialData={convertToOHLCV(analysisData.historicalData || [])}
                    height={400}
                    currency={analysisData.currency}
                    showVolume={true}
                    defaultChartType="candlestick"
                    defaultTimeframe={timeframe}
                    indicators={indicatorConfig}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Technical Indicators</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">RSI (Relative Strength Index)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Value</span>
                          <span className="font-bold">{analysisData.technicalIndicators.rsi.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${analysisData.technicalIndicators.rsi}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {analysisData.technicalIndicators.rsi < 30 ? 'Oversold - Potential buy signal' :
                           analysisData.technicalIndicators.rsi > 70 ? 'Overbought - Potential sell signal' :
                           'Neutral zone'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Moving Averages</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>SMA 20</span>
                          <span className="font-bold">{formatPriceInCurrency(analysisData.technicalIndicators.sma20, analysisData.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SMA 50</span>
                          <span className="font-bold">{formatPriceInCurrency(analysisData.technicalIndicators.sma50, analysisData.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trend</span>
                          <Badge variant={analysisData.technicalIndicators.sma20 > analysisData.technicalIndicators.sma50 ? 'default' : 'destructive'}>
                            {analysisData.technicalIndicators.sma20 > analysisData.technicalIndicators.sma50 ? 'Bullish' : 'Bearish'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="font-semibold mb-2">Bollinger Bands</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <p className="text-slate-500">Upper</p>
                          <p className="font-bold text-lg">{formatPriceInCurrency(analysisData.technicalIndicators.bollingerBands.upper, analysisData.currency)}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-slate-500">Middle</p>
                          <p className="font-bold text-lg">{formatPriceInCurrency(analysisData.technicalIndicators.bollingerBands.middle, analysisData.currency)}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-slate-500">Lower</p>
                          <p className="font-bold text-lg">{formatPriceInCurrency(analysisData.technicalIndicators.bollingerBands.lower, analysisData.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="forecast" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">30-Day Price Forecast</h3>
                  <div className="text-sm text-slate-500 mb-4">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Forecasts are based on historical trends and should not be considered investment advice.
                  </div>
                  <div className="space-y-2">
                    {analysisData.forecast.slice(0, 10).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-500 w-24">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-semibold">
                            {formatPriceInCurrency(item.predictedPrice, analysisData.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-12">{item.confidence.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Forecast Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Forecast Visualization</h3>
                  <ProfessionalChart
                    symbol={analysisData.symbol}
                    name={analysisData.name}
                    initialData={convertToOHLCV(analysisData.historicalData || [])}
                    height={400}
                    currency={analysisData.currency}
                    showVolume={false}
                    defaultChartType="area"
                    defaultTimeframe={timeframe}
                    indicators={{ bollingerBands: true }}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!analysisData && !loading && (
          <Card className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">Enter a Symbol to Analyze</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Get professional candlestick charts, technical indicators, trading signals, and price forecasts
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg max-w-md mx-auto text-left">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Supported instruments:</p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Indonesian Stocks: BBCA.JK, BBRI.JK, TLKM.JK, etc.</li>
                <li>• Precious Metals: GOLD, SILVER, PLATINUM, PALLADIUM</li>
                <li>• Cryptocurrencies: BTC-USD, ETH-USD, SOL-USD, etc.</li>
                <li>• US Stocks: AAPL, TSLA, MSFT, etc.</li>
              </ul>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
