'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/stores/usePreferences';

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

interface TimeframeSelectorProps {
  value?: Timeframe;
  onChange?: (timeframe: Timeframe) => void;
}

const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y'];

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const { defaultTimeframe, setDefaultTimeframe } = usePreferences();
  const selectedTimeframe = value || defaultTimeframe;

  const handleTimeframeChange = (timeframe: Timeframe) => {
    if (onChange) {
      onChange(timeframe);
    } else {
      setDefaultTimeframe(timeframe);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 mr-2">Timeframe:</span>
      <div className="flex gap-1">
        {timeframes.map((tf) => (
          <Button
            key={tf}
            variant={selectedTimeframe === tf ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeframeChange(tf)}
            className="h-7 px-3 text-xs font-medium"
          >
            {tf}
          </Button>
        ))}
      </div>
    </div>
  );
}
