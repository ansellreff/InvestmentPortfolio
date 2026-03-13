'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  options?: Timeframe[];
  compact?: boolean;
  className?: string;
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1D': '1 Day',
  '1W': '1 Week',
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  '5Y': '5 Years',
  'ALL': 'All Time',
};

const DEFAULT_OPTIONS: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];

const COMPACT_OPTIONS: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y'];

export function TimeframeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  compact = false,
  className = '',
}: TimeframeSelectorProps) {
  const displayOptions = compact ? COMPACT_OPTIONS.filter(o => options.includes(o)) : options;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-slate-500 dark:text-slate-400">Timeframe:</span>
      <Card className="p-1 inline-flex">
        <div className="flex gap-1">
          {displayOptions.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={value === option ? 'default' : 'ghost'}
              onClick={() => onChange(option)}
              className="h-8 text-xs px-3"
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Helper function to convert timeframe to days for API calls
export function timeframeToDays(timeframe: Timeframe): number {
  const mapping: Record<Timeframe, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '5Y': 365 * 5,
    'ALL': 365 * 20,
  };
  return mapping[timeframe];
}
