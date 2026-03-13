'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface ExcelExportProps {
  data: any[];
  type?: 'comparison' | 'simulation';
  filename?: string;
}

export function ExcelExport({ data, type = 'comparison', filename }: ExcelExportProps) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const generateCSV = () => {
    if (data.length === 0) return '';

    if (type === 'simulation') {
      // Simulation data CSV
      const headers = ['Symbol', 'Name', 'Initial Investment', 'Current Value', 'Profit/Loss', 'Return %', 'Total Units', 'Avg Price/Unit', 'Current Price', 'Currency'];
      const rows = data.map((item: any) => [
        item.symbol,
        item.name,
        item.initialInvestment.toFixed(2),
        item.currentValue.toFixed(2),
        item.profitLoss.toFixed(2),
        item.profitLossPercent.toFixed(2),
        item.totalUnits.toFixed(4),
        item.avgPricePerUnit.toFixed(2),
        item.currentPrice.toFixed(2),
        item.currency,
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      // Comparison data CSV
      const headers = ['#', 'Symbol', 'Name', 'Type', 'Price', 'Currency'];
      const rows = data.map((item: any, idx: number) => [
        idx + 1,
        item.symbol,
        item.name,
        item.type,
        (item.price || 0).toFixed(2),
        item.currency || 'USD',
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const csv = generateCSV();
      const defaultFilename = type === 'simulation'
        ? `investment-simulation-${new Date().toISOString().split('T')[0]}.csv`
        : `investment-comparison-${new Date().toISOString().split('T')[0]}.csv`;

      const finalFilename = filename || defaultFilename;

      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({
        type: 'success',
        message: 'Data exported successfully! Check your downloads folder.',
      });
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: 'Failed to export. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  const itemCount = data.length;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Export to CSV</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {type === 'simulation' ? 'Export simulation results' : 'Export comparison data'} to CSV file
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={exporting || itemCount === 0}
        className="w-full"
      >
        {exporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download CSV File
          </>
        )}
      </Button>

      {/* Status Messages */}
      {exportStatus.type && (
        <div
          className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            exportStatus.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
          }`}
        >
          {exportStatus.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <p className="text-sm">{exportStatus.message}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Format:</strong> CSV (Comma Separated Values) - Compatible with Excel, Google Sheets, and other spreadsheet applications.
        </p>
      </div>
    </Card>
  );
}
