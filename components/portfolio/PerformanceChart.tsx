'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, AreaSeries } from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';

interface PerformanceDataPoint {
  date: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  currency?: string;
  height?: number;
}

export function PerformanceChart({ data, currency = 'USD', height = 300 }: PerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      rightPriceScale: {
        borderColor: '#e1e1e1',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        borderColor: '#e1e1e1',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Add area series using v5 API
    const areaSeries = chart.addSeries(AreaSeries, {
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Set data - convert date to timestamp for lightweight-charts
    const chartData = data.map((d) => ({
      time: (new Date(d.date).getTime() / 1000) as any,
      value: d.value,
    }));

    areaSeries.setData(chartData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height]);

  // Format currency - convert from USD to user's selected currency
  const formatCurrency = (value: number) => {
    return formatPrice(value, currency);
  };

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          <p>No performance data available yet.</p>
          <p className="text-sm mt-2">Add positions to your portfolio to track performance.</p>
        </div>
      </Card>
    );
  }

  // Calculate stats
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Portfolio Performance</h3>
          <p className="text-sm text-slate-500">
            {data.length > 0 && `${data[0].date} - ${data[data.length - 1].date}`}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(lastValue)}
          </p>
          <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{formatCurrency(change)}
            ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div ref={chartContainerRef} style={{ height: `${height}px` }} />
    </Card>
  );
}
