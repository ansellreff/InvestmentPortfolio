'use client';

interface MiniChartProps {
  data: number[];
  change: number;
  isUp: boolean;
  width?: number;
  height?: number;
  showPercentage?: boolean;
}

export function MiniChart({ data, change, isUp, width = 128, height = 64, showPercentage = false }: MiniChartProps) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-20">
        <rect width={width} height={height} fill="currentColor" rx="4" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = isUp ? '#00C853' : '#FF3D00';

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${isUp ? 'up' : 'down'}-${width}-${height}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#gradient-${isUp ? 'up' : 'down'}-${width}-${height})`}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      {showPercentage && (
        <span className={`text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}
