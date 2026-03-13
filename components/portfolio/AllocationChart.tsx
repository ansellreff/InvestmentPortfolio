'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Position } from '@/stores/usePortfolioStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCurrency } from '@/hooks/useCurrency';

interface AllocationChartProps {
  positions: Position[];
}

export function AllocationChart({ positions }: AllocationChartProps) {
  const { formatPrice, convertPrice } = useCurrency();

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8 text-sm">Add positions to see allocation</p>
        </CardContent>
      </Card>
    );
  }

  // Group by type - convert each position to USD first for accurate allocation
  const allocationByType = positions.reduce((acc, position) => {
    const key = position.type;
    if (!acc[key]) {
      acc[key] = { count: 0, valueUSD: 0 };
    }
    acc[key].count += 1;
    // Convert position value to USD for consistent allocation calculation
    const positionValueUSD = convertPrice(position.quantity * position.averageBuyPrice, position.currency).price;
    acc[key].valueUSD += positionValueUSD;
    return acc;
  }, {} as Record<string, { count: number; valueUSD: number }>);

  // Group by symbol - convert to USD
  const allocationBySymbol = positions.map((position) => {
    const positionValueUSD = convertPrice(position.quantity * position.averageBuyPrice, position.currency).price;
    return {
      name: position.symbol,
      value: positionValueUSD,
      type: position.type,
      currency: position.currency,
    };
  });

  const COLORS: Record<string, string> = {
    'GOLD': '#EAB308',
    'SILVER': '#94A3B8',
    'PLATINUM': '#9CA3AF',
    'PALLADIUM': '#6366F1',
    'CRYPTO': '#8B5CF6',
    'STOCK': '#3B82F6',
  };

  const typeData = Object.entries(allocationByType).map(([type, data]) => ({
    name: type,
    value: data.valueUSD,
    count: data.count,
    color: COLORS[type] || '#6B7280',
  }));

  const symbolData = allocationBySymbol.map((item) => ({
    name: item.name,
    value: item.value,
    type: item.type,
    color: COLORS[item.type] || '#6B7280',
  }));

  const totalValue = symbolData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* By Type Pie Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4">By Asset Type</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined, name?: string) => {
                  const val = value ?? 0;
                  const nm = name ?? '';
                  const dataPoint = typeData.find(d => d.name === nm);
                  const count = dataPoint?.count || 0;
                  // Convert from USD to user's selected currency for display
                  return [
                    `${nm}: ${formatPrice(val, 'USD')}`,
                    `${count} position${count !== 1 ? 's' : ''}`,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {typeData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
              <span className="ml-auto font-medium">
                {((item.value / totalValue) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
