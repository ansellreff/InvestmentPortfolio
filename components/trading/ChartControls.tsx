'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/stores/usePreferences';
import { BarChart3, TrendingUp } from 'lucide-react';

type ChartType = 'line' | 'candlestick' | 'area';

interface ChartControlsProps {
  chartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  showVolume?: boolean;
  onVolumeToggle?: (show: boolean) => void;
  showIndicators?: boolean;
  onIndicatorsToggle?: (show: boolean) => void;
}

// Custom chart icons
const CandlestickIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <line x1="6" y1="4" x2="6" y2="20" />
    <rect x="4" y="6" width="4" height="8" className="fill-green-500" />
    <line x1="12" y1="8" x2="12" y2="18" />
    <rect x="10" y="10" width="4" height="6" className="fill-red-500" />
    <line x1="18" y1="6" x2="18" y2="16" />
    <rect x="16" y="8" width="4" height="6" className="fill-green-500" />
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const AreaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" className="fill-current opacity-20" />
  </svg>
);

export function ChartControls({
  chartType,
  onChartTypeChange,
  showVolume,
  onVolumeToggle,
  showIndicators,
  onIndicatorsToggle,
}: ChartControlsProps) {
  const {
    defaultChartType,
    setDefaultChartType,
    showVolume: prefShowVolume,
    setShowVolume,
    showIndicators: prefShowIndicators,
    setShowIndicators,
  } = usePreferences();

  const currentChartType = chartType || defaultChartType;
  const currentShowVolume = showVolume !== undefined ? showVolume : prefShowVolume;
  const currentShowIndicators = showIndicators !== undefined ? showIndicators : prefShowIndicators;

  const chartTypes: { type: ChartType; icon: React.ReactNode; label: string }[] = [
    { type: 'candlestick', icon: <CandlestickIcon />, label: 'Candles' },
    { type: 'line', icon: <LineIcon />, label: 'Line' },
    { type: 'area', icon: <AreaIcon />, label: 'Area' },
  ];

  const handleChartTypeChange = (type: ChartType) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    } else {
      setDefaultChartType(type);
    }
  };

  const handleVolumeToggle = () => {
    const newValue = !currentShowVolume;
    if (onVolumeToggle !== undefined) {
      onVolumeToggle(newValue);
    } else {
      setShowVolume(newValue);
    }
  };

  const handleIndicatorsToggle = () => {
    const newValue = !currentShowIndicators;
    if (onIndicatorsToggle !== undefined) {
      onIndicatorsToggle(newValue);
    } else {
      setShowIndicators(newValue);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Chart Type Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Chart Type:</span>
        <div className="flex gap-1">
          {chartTypes.map(({ type, icon, label }) => (
            <Button
              key={type}
              variant={currentChartType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange(type)}
              className="h-8 px-3 text-xs"
              title={label}
            >
              {icon}
              <span className="ml-1 hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Volume Toggle */}
      <Button
        variant={currentShowVolume ? 'default' : 'outline'}
        size="sm"
        onClick={handleVolumeToggle}
        className="h-8 px-3 text-xs"
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Volume
      </Button>

      {/* Indicators Toggle */}
      <Button
        variant={currentShowIndicators ? 'default' : 'outline'}
        size="sm"
        onClick={handleIndicatorsToggle}
        className="h-8 px-3 text-xs"
      >
        <TrendingUp className="h-4 w-4 mr-1" />
        Indicators
      </Button>
    </div>
  );
}
