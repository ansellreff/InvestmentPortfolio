'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export interface IndicatorConfig {
  sma: number[];
  ema: number[];
  bollingerBands: boolean;
}

interface IndicatorControlsProps {
  config: IndicatorConfig;
  onChange: (config: IndicatorConfig) => void;
  className?: string;
  collapsed?: boolean;
}

const DEFAULT_PERIODS = {
  sma: [20, 50],
  ema: [12, 26],
};

const COLOR_INDICATORS = {
  sma: 'bg-orange-500',
  ema: 'bg-purple-500',
  bollingerBands: 'bg-pink-500',
};

export function IndicatorControls({
  config,
  onChange,
  className = '',
  collapsed: collapsedProp = false,
}: IndicatorControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsedProp);

  const addSMA = (period: number) => {
    if (!config.sma.includes(period)) {
      onChange({ ...config, sma: [...config.sma, period].sort((a, b) => a - b) });
    }
  };

  const removeSMA = (period: number) => {
    onChange({ ...config, sma: config.sma.filter(p => p !== period) });
  };

  const addEMA = (period: number) => {
    if (!config.ema.includes(period)) {
      onChange({ ...config, ema: [...config.ema, period].sort((a, b) => a - b) });
    }
  };

  const removeEMA = (period: number) => {
    onChange({ ...config, ema: config.ema.filter(p => p !== period) });
  };

  const resetDefaults = () => {
    onChange({
      sma: DEFAULT_PERIODS.sma,
      ema: DEFAULT_PERIODS.ema,
      bollingerBands: false,
    });
  };

  const clearAll = () => {
    onChange({
      sma: [],
      ema: [],
      bollingerBands: false,
    });
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-sm">Technical Indicators</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDefaults}
            className="h-7 text-xs"
            title="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Bollinger Bands */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${COLOR_INDICATORS.bollingerBands}`} />
              <Label htmlFor="bb-toggle" className="text-sm cursor-pointer">
                Bollinger Bands
              </Label>
            </div>
            <Switch
              id="bb-toggle"
              checked={config.bollingerBands}
              onCheckedChange={(checked) => onChange({ ...config, bollingerBands: checked })}
            />
          </div>

          {/* SMA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${COLOR_INDICATORS.sma}`} />
                <Label className="text-sm">SMA (Simple Moving Average)</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.sma.map((period) => (
                <Badge key={`sma-${period}`} variant="secondary" className="gap-1">
                  SMA {period}
                  <button
                    onClick={() => removeSMA(period)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Period (e.g., 20)"
                min="1"
                max="200"
                className="h-8 w-28"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const period = parseInt(target.value);
                    if (period > 0 && period <= 200) {
                      addSMA(period);
                      target.value = '';
                    }
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]');
                  inputs.forEach(input => {
                    const period = parseInt(input.value);
                    if (period > 0 && period <= 200) {
                      addSMA(period);
                      input.value = '';
                    }
                  });
                }}
              >
                Add
              </Button>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addSMA(10)}
                >
                  +10
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addSMA(20)}
                >
                  +20
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addSMA(50)}
                >
                  +50
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addSMA(200)}
                >
                  +200
                </Button>
              </div>
            </div>
          </div>

          {/* EMA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${COLOR_INDICATORS.ema}`} />
                <Label className="text-sm">EMA (Exponential Moving Average)</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.ema.map((period) => (
                <Badge key={`ema-${period}`} variant="secondary" className="gap-1">
                  EMA {period}
                  <button
                    onClick={() => removeEMA(period)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Period (e.g., 12)"
                min="1"
                max="200"
                className="h-8 w-28"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const period = parseInt(target.value);
                    if (period > 0 && period <= 200) {
                      addEMA(period);
                      target.value = '';
                    }
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  const input = document.querySelector(
                    `input[placeholder*="Period (e.g., 12)"]`
                  ) as HTMLInputElement;
                  if (input) {
                    const period = parseInt(input.value);
                    if (period > 0 && period <= 200) {
                      addEMA(period);
                      input.value = '';
                    }
                  }
                }}
              >
                Add
              </Button>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addEMA(9)}
                >
                  +9
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addEMA(12)}
                >
                  +12
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => addEMA(26)}
                >
                  +26
                </Button>
              </div>
            </div>
          </div>

          {/* Clear All */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="w-full text-xs"
            >
              Clear All Indicators
            </Button>
          </div>
        </div>
      )}

      {/* Active indicators summary when collapsed */}
      {isCollapsed && (
        <div className="flex flex-wrap gap-2">
          {config.bollingerBands && (
            <Badge variant="secondary" className={`${COLOR_INDICATORS.bollingerBands} text-white`}>
              BB
            </Badge>
          )}
          {config.sma.map((period) => (
            <Badge key={`sma-${period}`} variant="secondary" className={`${COLOR_INDICATORS.sma} text-white`}>
              SMA {period}
            </Badge>
          ))}
          {config.ema.map((period) => (
            <Badge key={`ema-${period}`} variant="secondary" className={`${COLOR_INDICATORS.ema} text-white`}>
              EMA {period}
            </Badge>
          ))}
          {!config.bollingerBands && config.sma.length === 0 && config.ema.length === 0 && (
            <span className="text-xs text-slate-500">No active indicators</span>
          )}
        </div>
      )}
    </Card>
  );
}

// Helper to get default indicator config
export function getDefaultIndicators(): IndicatorConfig {
  return {
    sma: DEFAULT_PERIODS.sma,
    ema: DEFAULT_PERIODS.ema,
    bollingerBands: false,
  };
}
