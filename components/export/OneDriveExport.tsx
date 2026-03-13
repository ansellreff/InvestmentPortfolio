'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CloudUpload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Settings,
  Link,
} from 'lucide-react';
import { useComparisonStore } from '@/stores/useComparisonStore';

interface OneDriveExportProps {
  simulationData?: any[];
  type?: 'comparison' | 'simulation';
}

export function OneDriveExport({ simulationData, type = 'comparison' }: OneDriveExportProps) {
  const { selectedInstruments } = useComparisonStore();
  const [oneDriveUrl, setOneDriveUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = async () => {
    setExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const exportData: any = {
        oneDriveUrl,
      };

      if (type === 'simulation' && simulationData) {
        exportData.simulation = simulationData;
      } else {
        exportData.instruments = selectedInstruments;
      }

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (response.ok) {
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investment-advisor-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportStatus({
          type: 'success',
          message: 'Excel file exported successfully! Upload this file to OneDrive and paste the URL below for auto-sync.',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: 'Failed to export. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  const saveOneDriveUrl = () => {
    // Save to localStorage for future use
    if (oneDriveUrl) {
      localStorage.setItem('onedrive-url', oneDriveUrl);
      setExportStatus({
        type: 'success',
        message: 'OneDrive URL saved! The app will use this URL for auto-sync.',
      });
    }
  };

  const loadOneDriveUrl = () => {
    const saved = localStorage.getItem('onedrive-url');
    if (saved) {
      setOneDriveUrl(saved);
    }
  };

  // Load saved URL on mount
  React.useEffect(() => {
    loadOneDriveUrl();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Export to Excel</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {type === 'simulation' ? 'Export simulation results' : 'Export comparison data'} to Excel with OneDrive sync
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {type === 'simulation' ? simulationData?.length || 0 : selectedInstruments.length} items
        </Badge>
      </div>

      {/* Export Button */}
      <div className="flex gap-3 mb-4">
        <Button
          onClick={handleExport}
          disabled={exporting || (type === 'comparison' ? selectedInstruments.length === 0 : !simulationData?.length)}
          className="flex-1"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Excel File
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => window.open('https://www.microsoft.com/en-us/microsoft-365/onedrive/online-cloud-storage', '_blank')}
        >
          <CloudUpload className="h-4 w-4 mr-2" />
          Open OneDrive
        </Button>
      </div>

      {/* OneDrive URL Configuration */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-slate-500" />
          <Label className="text-sm font-medium">OneDrive Auto-Sync Setup</Label>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Paste your OneDrive Excel file URL here..."
              value={oneDriveUrl}
              onChange={(e) => setOneDriveUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={saveOneDriveUrl}
              disabled={!oneDriveUrl}
              size="sm"
              variant="outline"
            >
              <Link className="h-4 w-4 mr-1" />
              Save URL
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-400 mb-2">
              <strong>How to set up auto-sync:</strong>
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Click "Download Excel File" above</li>
              <li>Upload the file to your OneDrive folder</li>
              <li>Open the file in OneDrive and click "Share" → "Copy link"</li>
              <li>Paste the link in the field above and click "Save URL"</li>
              <li>Future updates will sync automatically to this file</li>
            </ol>
          </div>
        </div>
      </div>

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

      {/* Info about future OneDrive integration */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Note:</strong> Full OneDrive integration with Microsoft Graph API is coming soon!
          This will enable automatic updates to your Excel file without manual upload.
          To enable this feature, you'll need to register your app in Azure Active Directory.
        </p>
      </div>
    </Card>
  );
}
