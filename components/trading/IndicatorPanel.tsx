'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

type Indicator = 'SMA' | 'EMA' | 'BB' | 'RSI' | 'MACD';

interface IndicatorConfig {
  id: Indicator;
  name: string;
  description: string;
  enabled: boolean;
  period?: number;
  color: string;
}

export function IndicatorPanel() {
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: 'SMA', name: 'Simple Moving Average', description: 'Smooths price data to identify trends', enabled: true, period: 20, color: '#3B82F6' },
    { id: 'EMA', name: 'Exponential Moving Average', description: 'Weights recent prices more heavily', enabled: false, period: 20, color: '#8B5CF6' },
    { id: 'BB', name: 'Bollinger Bands', description: 'Measures volatility and overbought/oversold conditions', enabled: true, period: 20, color: '#F59E0B' },
    { id: 'RSI', name: 'Relative Strength Index', description: 'Measures speed and change of price movements', enabled: true, period: 14, color: '#10B981' },
    { id: 'MACD', name: 'Moving Average Convergence Divergence', description: 'Shows relationship between two moving averages', enabled: false, period: 12, color: '#EC4899' },
  ]);

  const toggleIndicator = (id: Indicator) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  const updatePeriod = (id: Indicator, period: number) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, period } : ind
      )
    );
  };

  const enabledCount = indicators.filter((ind) => ind.enabled).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold">Technical Indicators</h3>
          <Badge variant="secondary" className="text-xs">
            {enabledCount} Active
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {indicators.map((indicator) => (
          <div key={indicator.id} className="flex items-start justify-between p-3 rounded-lg border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor={`indicator-${indicator.id}`} className="font-semibold text-sm cursor-pointer">
                  {indicator.name}
                </Label>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: indicator.color }}
                />
              </div>
              <p className="text-xs text-slate-500 mb-2">{indicator.description}</p>

              {indicator.enabled && indicator.period && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500">Period:</span>
                  <Slider
                    value={[indicator.period]}
                    onValueChange={([value]) => updatePeriod(indicator.id, value)}
                    min={5}
                    max={50}
                    step={1}
                    className="flex-1 max-w-[150px]"
                  />
                  <span className="text-xs font-medium w-8">{indicator.period}</span>
                </div>
              )}
            </div>

            <Switch
              id={`indicator-${indicator.id}`}
              checked={indicator.enabled}
              onCheckedChange={() => toggleIndicator(indicator.id)}
            />
          </div>
        ))}
      </div>

      {enabledCount === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No indicators enabled</p>
          <p className="text-xs">Enable indicators to see technical analysis on the chart</p>
        </div>
      )}
    </Card>
  );
}
