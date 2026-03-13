'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, RefreshCw, Trash2, AlertCircle, Wallet, CheckCircle, Plus } from 'lucide-react';
import { ConnectDialog } from './ConnectDialog';
import { AddBinanceAssetDialog } from './AddBinanceAssetDialog';
import { useCurrency } from '@/hooks/useCurrency';

interface BinanceAsset {
  asset: string;
  free: number;
  locked: number;
  total: number;
  valueUSD?: number;
  lastUpdated: string;
}

interface BinanceData {
  connected: boolean;
  lastSyncAt?: string;
  testnet?: boolean;
  totalValueUSD?: number;
  assets: BinanceAsset[];
}

export function BinanceAssets() {
  const [data, setData] = useState<BinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<BinanceAsset | null>(null);
  const { formatPrice, convertPrice } = useCurrency();

  const handleAddToPortfolio = (asset: BinanceAsset) => {
    setSelectedAsset(asset);
    setAddDialogOpen(true);
  };

  const handleAssetAdded = () => {
    setAddDialogOpen(false);
    setSelectedAsset(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/binance/assets');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching Binance assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/binance/sync', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        fetchData();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error syncing Binance assets:', error);
      alert('Failed to sync assets. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Binance account? This will remove all synced assets.')) {
      return;
    }

    try {
      const response = await fetch('/api/binance/disconnect', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setData({ connected: false, assets: [] });
      } else {
        alert(`Disconnect failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error disconnecting Binance:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Binance Assets</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || !data.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Binance Assets
          </CardTitle>
          <CardDescription>
            Connect your Binance account to view and sync your crypto assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Connect your Binance account to automatically sync your holdings
            </p>
            <ConnectDialog onConnected={fetchData} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Binance Assets
              <Badge variant="outline" className="ml-2">
                {data.testnet ? 'Testnet' : 'Mainnet'}
              </Badge>
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </CardTitle>
            <CardDescription>
              {data.totalValueUSD ? `Total Value: $${data.totalValueUSD.toLocaleString()}` : ''}
              {data.lastSyncAt && ` • Last synced: ${new Date(data.lastSyncAt).toLocaleString()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              disabled={syncing}
              title="Sync now"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.assets.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No assets found</p>
            <Button onClick={handleSync} disabled={syncing} className="mt-4" size="sm">
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.assets.map((asset) => (
              <div
                key={asset.asset}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{asset.asset}</span>
                    {asset.valueUSD && (
                      <Badge variant="secondary" className="text-xs">
                        {formatPrice(asset.valueUSD, 'USD')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span>Available: {asset.free.toFixed(8)}</span>
                    {asset.locked > 0 && (
                      <span className="ml-3">
                        Locked: {asset.locked.toFixed(8)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium">{asset.total.toFixed(8)}</p>
                    <p className="text-xs text-slate-500">{asset.asset}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddToPortfolio(asset)}
                    title="Add to portfolio"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add to Portfolio Dialog */}
      {selectedAsset && (
        <AddBinanceAssetDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          asset={selectedAsset}
          onAssetAdded={handleAssetAdded}
        />
      )}
    </Card>
  );
}
