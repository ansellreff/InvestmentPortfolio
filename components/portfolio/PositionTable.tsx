'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Position } from '@/stores/usePortfolioStore';
import { TrendingUp, TrendingDown, Edit3, Trash2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface EnrichedPosition extends Position {
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  priceCurrency?: string; // The actual currency of the current price
  costBasis?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

interface PositionTableProps {
  positions: EnrichedPosition[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  flashStates?: Record<string, 'up' | 'down' | null>;
}

export function PositionTable({ positions, onEdit, onDelete, loading = false, flashStates = {} }: PositionTableProps) {
  const { formatPrice } = useCurrency();
  const typeColors: Record<string, string> = {
    'GOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'SILVER': 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    'PLATINUM': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'PALLADIUM': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'CRYPTO': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'STOCK': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">No positions added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const isProfitable = (position.profitLoss || 0) >= 0;
                const flashDir = flashStates[position.symbol];

                return (
                  <TableRow key={position.id} className={flashDir ? (flashDir === 'up' ? 'bg-green-50/30 dark:bg-green-900/10' : 'bg-red-50/30 dark:bg-red-900/10') : ''}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{position.symbol}</p>
                        <p className="text-xs text-slate-500">{position.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{position.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(position.averageBuyPrice, position.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className={`font-medium tabular-nums transition-colors ${
                          flashDir === 'up' ? 'text-green-600' :
                          flashDir === 'down' ? 'text-red-600' : ''
                        }`}>
                          {position.currentPrice !== undefined
                            ? formatPrice(position.currentPrice, position.priceCurrency || position.currency)
                            : '—'}
                        </span>
                        {position.changePercent !== undefined && position.changePercent !== 0 && (
                          <span
                            className={`text-xs ml-2 ${position.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            ({position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(position.costBasis || position.quantity * position.averageBuyPrice, position.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {formatPrice(position.currentValue || position.quantity * position.averageBuyPrice, position.priceCurrency || position.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={isProfitable ? 'text-green-600' : 'text-red-600'}>
                        <span className="font-medium">
                          {isProfitable ? '+' : ''}{formatPrice(position.profitLoss || 0, position.priceCurrency || position.currency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={`font-medium ${
                          position.profitLossPercent !== undefined
                            ? isProfitable
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {position.profitLossPercent !== undefined
                          ? (isProfitable ? '+' : '') + position.profitLossPercent.toFixed(2) + '%'
                          : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(position)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(position.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
