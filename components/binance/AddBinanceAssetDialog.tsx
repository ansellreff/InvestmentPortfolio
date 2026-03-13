'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { usePortfolioStore } from '@/stores/usePortfolioStore';

interface BinanceAsset {
  asset: string;
  free: number;
  locked: number;
  total: number;
  valueUSD?: number;
  lastUpdated: string;
}

interface AddBinanceAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: BinanceAsset;
  onAssetAdded: () => void;
}

interface CryptoPriceData {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export function AddBinanceAssetDialog({
  open,
  onOpenChange,
  asset,
  onAssetAdded,
}: AddBinanceAssetDialogProps) {
  const { formatPrice, convertPrice, targetCurrency } = useCurrency();
  const { addPositionWithSync } = usePortfolioStore();

  const [quantity, setQuantity] = useState(asset.total.toFixed(8));
  const [averageBuyPrice, setAverageBuyPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceData, setPriceData] = useState<CryptoPriceData | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Determine symbol format for API
  const getApiSymbol = (asset: string): string => {
    // Convert Binance asset to crypto symbol (e.g., BTC -> BTC-USD)
    return `${asset}-USD`;
  };

  // Strip "LD" prefix from Binance assets (LD = Ledger tokens)
  // e.g., "LDXRP" -> "XRP"
  const getCleanAsset = (asset: string): string => {
    if (asset.toUpperCase().startsWith('LD')) {
      return asset.substring(2);
    }
    return asset;
  };

  // Fetch current price for the asset
  const fetchPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const symbol = getApiSymbol(asset.asset);
      const response = await fetch(`/api/crypto/price?symbol=${symbol}`);
      const result = await response.json();

      if (result.success && result.data) {
        setPriceData({
          price: result.data.price,
          change: result.data.change || 0,
          changePercent: result.data.changePercent || 0,
          currency: result.data.currency || 'USD',
        });

        // Pre-fill average buy price with current price if empty
        if (!averageBuyPrice) {
          // Convert to user's currency
          const converted = convertPrice(result.data.price, 'USD');
          setAverageBuyPrice(converted.price.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPrice();
      setQuantity(asset.total.toFixed(8));
      const cleanName = getCleanAsset(asset.asset);
      setNotes(`From Binance (${asset.asset}) - ${new Date().toLocaleDateString()}`);
    }
  }, [open, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || !averageBuyPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanAsset = getCleanAsset(asset.asset);
      const symbol = getApiSymbol(cleanAsset);
      const name = `${cleanAsset} (from Binance)`;

      const position = {
        symbol,
        name,
        type: 'CRYPTO' as const,
        quantity: parseFloat(quantity),
        averageBuyPrice: parseFloat(averageBuyPrice),
        currency: targetCurrency,
        notes,
      };

      const success = await addPositionWithSync(position);

      if (success) {
        onAssetAdded();
        // Reset form
        setQuantity(asset.total.toFixed(8));
        setAverageBuyPrice('');
        setNotes('');
      } else {
        alert('Failed to add position. Please try again.');
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Failed to add position. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total value
  const totalValue = quantity && averageBuyPrice
    ? (parseFloat(quantity) * parseFloat(averageBuyPrice))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add {getCleanAsset(asset.asset)} to Portfolio
          </DialogTitle>
          <DialogDescription>
            Add your Binance {getCleanAsset(asset.asset)} holdings to your investment portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Info Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-900 dark:text-amber-100 text-lg">{getCleanAsset(asset.asset)}</span>
                  {asset.asset !== getCleanAsset(asset.asset) && (
                    <Badge variant="outline" className="text-xs" title="Original: {asset.asset}">
                      {asset.asset}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">CRYPTO</Badge>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Available in Binance: {asset.free.toFixed(8)}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchPrice}
                disabled={isLoadingPrice}
                className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-md transition-colors"
                title="Refresh price"
              >
                <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${isLoadingPrice ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Live Price Display */}
            {isLoadingPrice && !priceData ? (
              <div className="flex items-center justify-center py-2 bg-white dark:bg-slate-800 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600 mr-2" />
                <span className="text-sm text-slate-500">Loading price...</span>
              </div>
            ) : priceData ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Price</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatPrice(priceData.price, 'USD')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priceData.changePercent >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {priceData.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="text-sm font-medium">
                      {priceData.changePercent >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity ({getCleanAsset(asset.asset)}) *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                min="0"
                max={asset.total}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuantity(asset.total.toFixed(8))}
                title="Use all available"
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Available: {asset.total.toFixed(8)} {getCleanAsset(asset.asset)}
            </p>
          </div>

          {/* Average Buy Price */}
          <div>
            <Label htmlFor="buyPrice">Average Buy Price ({targetCurrency}) *</Label>
            <Input
              id="buyPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter your average buy price"
              value={averageBuyPrice}
              onChange={(e) => setAverageBuyPrice(e.target.value)}
              required
              className="mt-1"
            />
            {priceData && (
              <p className="text-xs text-slate-500 mt-1">
                Current price: {formatPrice(priceData.price, 'USD')}
              </p>
            )}
          </div>

          {/* Total Value Preview */}
          {totalValue > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Value</span>
                <span className="font-semibold text-lg">
                  {formatPrice(totalValue, targetCurrency)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Long-term hold, DCA position"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity || !averageBuyPrice}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
