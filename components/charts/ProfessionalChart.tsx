'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { marketDataClient, MarketDataUpdate } from '@/lib/websocket/marketDataClient';

export type ChartType = 'candlestick' | 'bar' | 'line' | 'area';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ProfessionalChartProps {
  symbol: string;
  name: string;
  initialData?: OHLCVData[];
  height?: number;
  currency?: string;
  showVolume?: boolean;
  defaultChartType?: ChartType;
  defaultTimeframe?: Timeframe;
  indicators?: {
    sma?: number[];
    ema?: number[];
    bollingerBands?: boolean;
  };
  realtime?: boolean;  // Enable real-time updates
  onDataPointClick?: (data: OHLCVData) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

const TIMEFRAME_TO_DAYS: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '5Y': 365 * 5,
  'ALL': 365 * 20,
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  candlestick: 'Candles',
  bar: 'Bars',
  line: 'Line',
  area: 'Area',
};

// Available indicator options
const INDICATOR_OPTIONS = {
  sma: [
    { period: 20, label: 'SMA 20', color: '#f59e0b', description: '20-day Simple Moving Average' },
    { period: 50, label: 'SMA 50', color: '#f59e0b', description: '50-day Simple Moving Average' },
    { period: 200, label: 'SMA 200', color: '#f59e0b', description: '200-day Simple Moving Average' },
  ],
  ema: [
    { period: 12, label: 'EMA 12', color: '#8b5cf6', description: '12-day Exponential Moving Average' },
    { period: 26, label: 'EMA 26', color: '#8b5cf6', description: '26-day Exponential Moving Average' },
    { period: 50, label: 'EMA 50', color: '#8b5cf6', description: '50-day Exponential Moving Average' },
  ],
  bollingerBands: { label: 'Bollinger Bands', color: '#ec4899', description: 'Volatility bands' },
};

export function ProfessionalChart({
  symbol,
  name,
  initialData = [],
  height = 500,
  currency = 'USD',
  showVolume = true,
  defaultChartType = 'candlestick',
  defaultTimeframe = '3M',
  indicators = {},
  realtime = false,
  onDataPointClick,
  onTimeframeChange,
}: ProfessionalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());

  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isUp, setIsUp] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [isLive, setIsLive] = useState(false);  // Live indicator state

  // Simplified indicator state - each indicator can be toggled independently
  const [activeIndicators, setActiveIndicators] = useState({
    sma20: true,
    sma50: true,
    sma200: false,
    ema12: true,
    ema26: true,
    ema50: false,
    bollingerBands: false,
  });

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const colors = useMemo(() => ({
    backgroundColor: 'transparent',
    lineColor: '#3b82f6',
    areaColor: 'rgba(59, 130, 246, 0.3)',
    candleUpColor: '#22c55e',
    candleDownColor: '#ef4444',
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444',
    gridColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#4b5563',
    volumeColor: 'rgba(59, 130, 246, 0.5)',
    smaColor: '#f59e0b',
    emaColor: '#8b5cf6',
    bollingerBandsColor: 'rgba(236, 72, 153, 0.5)',
  }), []);

  // Toggle a single indicator on/off
  const toggleIndicator = (key: keyof typeof activeIndicators) => {
    setActiveIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset to default indicators
  const resetToDefaults = () => {
    setActiveIndicators({
      sma20: true,
      sma50: true,
      sma200: false,
      ema12: true,
      ema26: true,
      ema50: false,
      bollingerBands: false,
    });
  };

  // Remove all indicators
  const clearAllIndicators = () => {
    setActiveIndicators({
      sma20: false,
      sma50: false,
      sma200: false,
      ema12: false,
      ema26: false,
      ema50: false,
      bollingerBands: false,
    });
  };

  // Enable all indicators
  const enableAllIndicators = () => {
    setActiveIndicators({
      sma20: true,
      sma50: true,
      sma200: true,
      ema12: true,
      ema26: true,
      ema50: true,
      bollingerBands: true,
    });
  };

  // Get list of active SMA periods
  const activeSmaPeriods = [20, 50, 200].filter(p => activeIndicators[`sma${p}` as keyof typeof activeIndicators]);

  // Get list of active EMA periods
  const activeEmaPeriods = [12, 26, 50].filter(p => activeIndicators[`ema${p}` as keyof typeof activeIndicators]);

  // Single effect for chart initialization and updates
  useEffect(() => {
    if (!isClient || !chartContainerRef.current || initialData.length === 0) return;

    const container = chartContainerRef.current;

    // Clean up any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Clear container
    container.innerHTML = '';

    // Clear indicator series ref
    indicatorSeriesRef.current.clear();

    // Ensure container has dimensions
    const containerWidth = container.clientWidth || 800;
    const containerHeight = height || 500;

    try {
      // Create chart with explicit options
      const chart = createChart(container, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: colors.gridColor,
          mode: PriceScaleMode.Normal,
        },
        timeScale: {
          borderColor: colors.gridColor,
          timeVisible: true,
          secondsVisible: false,
        },
      });

      if (!chart) {
        console.error('[ProfessionalChart] Failed to create chart');
        return;
      }

      chartRef.current = chart;

      // Create main series based on chart type - using v5 API
      let mainSeries: ISeriesApi<any>;
      switch (chartType) {
        case 'candlestick':
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: colors.candleUpColor,
            downColor: colors.candleDownColor,
            borderUpColor: colors.candleUpColor,
            borderDownColor: colors.candleDownColor,
            wickUpColor: colors.wickUpColor,
            wickDownColor: colors.wickDownColor,
          });
          break;
        case 'bar':
          mainSeries = chart.addSeries(BarSeries, {
            upColor: colors.candleUpColor,
            downColor: colors.candleDownColor,
          });
          break;
        case 'line':
          mainSeries = chart.addSeries(LineSeries, {
            color: colors.lineColor,
            lineWidth: 2,
          });
          break;
        case 'area':
          mainSeries = chart.addSeries(AreaSeries, {
            lineColor: colors.lineColor,
            topColor: colors.areaColor,
            bottomColor: 'transparent',
            lineWidth: 2,
          });
          break;
        default:
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: colors.candleUpColor,
            downColor: colors.candleDownColor,
            borderUpColor: colors.candleUpColor,
            borderDownColor: colors.candleDownColor,
            wickUpColor: colors.wickUpColor,
            wickDownColor: colors.wickDownColor,
          });
      }

      mainSeriesRef.current = mainSeries;

      // Set data - ensure unique timestamps and proper sorting
      const uniqueDataMap = new Map<number, typeof initialData[0]>();

      // Deduplicate by timestamp (keep the last entry for each timestamp)
      initialData.forEach(d => {
        uniqueDataMap.set(d.time, d);
      });

      // Convert to array and ensure ascending order by time
      const sortedUniqueData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);

      const chartData = sortedUniqueData.map(d => {
        if (chartType === 'line' || chartType === 'area') {
          return { time: d.time as any, value: d.close };
        }
        return {
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        };
      });

      mainSeries.setData(chartData);

      // Add volume series - using v5 API
      if (showVolume && initialData.some(d => d.volume)) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: colors.volumeColor,
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        });

        const volumeData = initialData
          .filter(d => d.volume !== undefined)
          .map(d => ({
            time: d.time as any,
            value: d.volume!,
            color: d.close >= d.open ? colors.candleUpColor : colors.candleDownColor,
          }));

        volumeSeries.setData(volumeData as any);
        chart.priceScale('volume')?.applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });

        volumeSeriesRef.current = volumeSeries;
      }

      // Calculate and add SMA indicators
      activeSmaPeriods.forEach(period => {
        const calculateSMA = (data: typeof initialData, p: number) => {
          const result = [];
          for (let i = p - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < p; j++) {
              sum += data[i - j].close;
            }
            result.push({ time: data[i].time, value: sum / p });
          }
          return result;
        };

        const smaData = calculateSMA(initialData, period);
        const smaSeries = chart.addSeries(LineSeries, {
          color: colors.smaColor,
          lineWidth: 1,
          title: `SMA${period}`,
        });
        smaSeries.setData(smaData as any);
        indicatorSeriesRef.current.set(`sma${period}`, smaSeries);
      });

      // Calculate and add EMA indicators
      activeEmaPeriods.forEach(period => {
        const calculateEMA = (data: typeof initialData, p: number) => {
          const result = [];
          const mult = 2 / (p + 1);
          let sum = 0;
          for (let i = 0; i < p && i < data.length; i++) {
            sum += data[i].close;
          }
          let ema = sum / Math.min(p, data.length);

          for (let i = p - 1; i < data.length; i++) {
            ema = (data[i].close - ema) * mult + ema;
            result.push({ time: data[i].time, value: ema });
          }
          return result;
        };

        const emaData = calculateEMA(initialData, period);
        const emaSeries = chart.addSeries(LineSeries, {
          color: colors.emaColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          title: `EMA${period}`,
        });
        emaSeries.setData(emaData as any);
        indicatorSeriesRef.current.set(`ema${period}`, emaSeries);
      });

      // Add Bollinger Bands
      if (activeIndicators.bollingerBands) {
        const period = 20;
        const stdDev = 2;

        const calculateSMA = (data: typeof initialData, p: number) => {
          const result = [];
          for (let i = p - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < p; j++) {
              sum += data[i - j].close;
            }
            result.push({ time: data[i].time, value: sum / p });
          }
          return result;
        };

        const smaData = calculateSMA(initialData, period);
        const upperData = [];
        const lowerData = [];

        for (let i = period - 1; i < initialData.length; i++) {
          const slice = initialData.slice(i - period + 1, i + 1);
          const mean = smaData[i - period + 1].value;
          const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / period;
          const std = Math.sqrt(variance);

          upperData.push({ time: initialData[i].time, value: mean + stdDev * std });
          lowerData.push({ time: initialData[i].time, value: mean - stdDev * std });
        }

        const upperSeries = chart.addSeries(LineSeries, {
          color: colors.bollingerBandsColor,
          lineWidth: 1,
          title: 'BB Upper',
        });
        const lowerSeries = chart.addSeries(LineSeries, {
          color: colors.bollingerBandsColor,
          lineWidth: 1,
          title: 'BB Lower',
        });

        upperSeries.setData(upperData as any);
        lowerSeries.setData(lowerData as any);
        indicatorSeriesRef.current.set('bbUpper', upperSeries);
        indicatorSeriesRef.current.set('bbLower', lowerSeries);
      }

      // Fit content
      chart.timeScale().fitContent();

      // Calculate price info
      if (initialData.length > 0) {
        const latest = initialData[initialData.length - 1];
        const first = initialData[0];
        setCurrentPrice(latest.close);
        const changeVal = ((latest.close - first.close) / first.close) * 100;
        setPriceChange(changeVal);
        setIsUp(changeVal >= 0);
      }

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (error) {
      console.error('[ProfessionalChart] Error creating chart:', error);
    }
  }, [isClient, initialData, chartType, showVolume, activeSmaPeriods, activeEmaPeriods, activeIndicators.bollingerBands, colors, height]);

  // Real-time data updates via WebSocket
  useEffect(() => {
    if (!realtime || !symbol) return;

    const handlePriceUpdate = (data: MarketDataUpdate) => {
      if (data.symbol === symbol && mainSeriesRef.current) {
        const now = Math.floor(Date.now() / 1000);
        const lastData = initialData[initialData.length - 1];

        if (lastData) {
          if (now - lastData.time < 60) {
            // Update existing candle (same minute)
            mainSeriesRef.current.update({
              time: lastData.time,
              open: lastData.open,
              high: Math.max(lastData.high, data.price),
              low: Math.min(lastData.low, data.price),
              close: data.price
            });
          } else {
            // Add new candle
            mainSeriesRef.current.update({
              time: now,
              open: data.price,
              high: data.price,
              low: data.price,
              close: data.price
            });
          }
        }

        setCurrentPrice(data.price);
        setPriceChange(data.changePercent);
        setIsUp(data.changePercent >= 0);
        setIsLive(true);

        // Reset "live" indicator after 2 seconds
        const timeout = setTimeout(() => setIsLive(false), 2000);
        return () => clearTimeout(timeout);
      }
    };

    marketDataClient.subscribe(symbol, handlePriceUpdate);

    return () => {
      marketDataClient.unsubscribe(symbol);
    };
  }, [realtime, symbol, initialData]);

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
  };

  // Count active indicators
  const activeCount = activeSmaPeriods.length + activeEmaPeriods.length + (activeIndicators.bollingerBands ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header with symbol info and controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{symbol}</h3>
              <Badge variant="outline">{name}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isLive && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  LIVE
                </span>
              )}
              {isUp ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-lg font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrencyUtil(currentPrice, currency)}
              </span>
              <span className="text-sm text-slate-500">
                {isUp ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          {/* Chart Type Selector */}
          <div className="flex gap-1">
            {(Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={chartType === type ? 'default' : 'outline'}
                onClick={() => handleChartTypeChange(type)}
                className="h-8 text-xs"
              >
                {CHART_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          {/* Indicator Settings Button */}
          <Button
            size="sm"
            variant={showIndicatorPanel ? 'default' : 'outline'}
            onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Indicators
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {activeCount}
              </Badge>
            )}
            {showIndicatorPanel ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <Card className="p-0 overflow-hidden">
        {!isClient ? (
          <div style={{ height: `${height}px` }} className="w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div ref={chartContainerRef} style={{ height: `${height}px` }} className="w-full" />
        )}
      </Card>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Timeframe:</span>
          <div className="flex gap-1">
            {(Object.keys(TIMEFRAME_TO_DAYS) as Timeframe[]).map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? 'default' : 'outline'}
                onClick={() => handleTimeframeChange(tf)}
                className="h-8 text-xs"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Indicators Quick View (when panel is closed) */}
        {!showIndicatorPanel && activeCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Active:</span>
            {activeIndicators.sma20 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.sma[0].color, borderWidth: '1px' }}>
                SMA 20
              </Badge>
            )}
            {activeIndicators.sma50 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.sma[1].color, borderWidth: '1px' }}>
                SMA 50
              </Badge>
            )}
            {activeIndicators.sma200 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.sma[2].color, borderWidth: '1px' }}>
                SMA 200
              </Badge>
            )}
            {activeIndicators.ema12 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.ema[0].color, borderWidth: '1px' }}>
                EMA 12
              </Badge>
            )}
            {activeIndicators.ema26 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.ema[1].color, borderWidth: '1px' }}>
                EMA 26
              </Badge>
            )}
            {activeIndicators.ema50 && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.ema[2].color, borderWidth: '1px' }}>
                EMA 50
              </Badge>
            )}
            {activeIndicators.bollingerBands && (
              <Badge variant="secondary" className="text-xs" style={{ borderColor: INDICATOR_OPTIONS.bollingerBands.color, borderWidth: '1px' }}>
                BB
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Indicator Settings Panel */}
      {showIndicatorPanel && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Actions</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={enableAllIndicators}
                  className="h-7 text-xs"
                >
                  Enable All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetToDefaults}
                  className="h-7 text-xs"
                >
                  Reset Defaults
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllIndicators}
                  className="h-7 text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear All
                </Button>
              </div>
            </div>
            {/* SMA Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INDICATOR_OPTIONS.sma[0].color }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Simple Moving Average (SMA)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 ml-5">
                {INDICATOR_OPTIONS.sma.map(({ period, label, description }) => {
                  const key = `sma${period}` as keyof typeof activeIndicators;
                  const isActive = activeIndicators[key];
                  return (
                    <button
                      key={period}
                      onClick={() => toggleIndicator(key)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${isActive
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-amber-300'
                        }
                      `}
                      title={description}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EMA Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INDICATOR_OPTIONS.ema[0].color }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Exponential Moving Average (EMA)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 ml-5">
                {INDICATOR_OPTIONS.ema.map(({ period, label, description }) => {
                  const key = `ema${period}` as keyof typeof activeIndicators;
                  const isActive = activeIndicators[key];
                  return (
                    <button
                      key={period}
                      onClick={() => toggleIndicator(key)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${isActive
                          ? 'bg-violet-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-violet-300'
                        }
                      `}
                      title={description}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bollinger Bands Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INDICATOR_OPTIONS.bollingerBands.color }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bollinger Bands
                </span>
              </div>
              <div className="ml-5">
                <button
                  onClick={() => toggleIndicator('bollingerBands')}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${activeIndicators.bollingerBands
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-pink-300'
                    }
                  `}
                  title={INDICATOR_OPTIONS.bollingerBands.description}
                >
                  {INDICATOR_OPTIONS.bollingerBands.label}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Points Info */}
      {initialData.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Data Points: {initialData.length}</span>
          <span>•</span>
          <span>
            Range: {new Date(initialData[0].time * 1000).toLocaleDateString()} - {new Date(initialData[initialData.length - 1].time * 1000).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
