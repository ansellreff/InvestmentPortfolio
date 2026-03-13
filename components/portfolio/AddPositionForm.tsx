'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Position, usePortfolioStore } from '@/stores/usePortfolioStore';
import { Search, Loader2, X, Check, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'CRYPTO' | 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
}

interface AddPositionFormProps {
  onSubmit: (position: Omit<Position, 'id' | 'addedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Omit<Position, 'id'>>) => void;
  editPosition?: Position | null;
  onCancel?: () => void;
}

// Quick add presets for metals
const METAL_PRESETS: SearchResult[] = [
  { symbol: 'GOLD', name: 'Gold (XAU)', type: 'GOLD' },
  { symbol: 'SILVER', name: 'Silver (XAG)', type: 'SILVER' },
  { symbol: 'PLATINUM', name: 'Platinum (XPT)', type: 'PLATINUM' },
  { symbol: 'PALLADIUM', name: 'Palladium (XPD)', type: 'PALLADIUM' },
];

// Popular crypto presets
const CRYPTO_PRESETS: SearchResult[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'SOL-USD', name: 'Solana', type: 'CRYPTO' },
  { symbol: 'BNB-USD', name: 'Binance Coin', type: 'CRYPTO' },
  { symbol: 'XRP-USD', name: 'XRP', type: 'CRYPTO' },
  { symbol: 'ADA-USD', name: 'Cardano', type: 'CRYPTO' },
  { symbol: 'DOGE-USD', name: 'Dogecoin', type: 'CRYPTO' },
  { symbol: 'DOT-USD', name: 'Polkadot', type: 'CRYPTO' },
];

interface LivePrice {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdate: number;
}

export function AddPositionForm({ onSubmit, onUpdate, editPosition, onCancel }: AddPositionFormProps) {
  const [symbol, setSymbol] = useState(editPosition?.symbol || '');
  const [name, setName] = useState(editPosition?.name || '');
  const [type, setType] = useState<'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO'>(
    editPosition?.type || 'STOCK'
  );
  const [quantity, setQuantity] = useState(editPosition?.quantity?.toString() || '');
  const [averageBuyPrice, setAverageBuyPrice] = useState(editPosition?.averageBuyPrice?.toString() || '');
  const [currency, setCurrency] = useState(editPosition?.currency || 'USD');
  const [notes, setNotes] = useState(editPosition?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [positionDeleted, setPositionDeleted] = useState(false);

  // Get portfolio store to check if position still exists
  const { positions } = usePortfolioStore();

  // Live price states
  const [livePrice, setLivePrice] = useState<LivePrice | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const { formatPrice: formatPriceInCurrency } = useCurrency();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch live price for the selected instrument
  const fetchLivePrice = useCallback(async (symbol: string, assetType: string) => {
    if (!symbol) return;

    setIsLoadingPrice(true);
    setPriceError(null);

    try {
      let endpoint = '';
      if (assetType === 'GOLD' || assetType === 'SILVER' || assetType === 'PLATINUM' || assetType === 'PALLADIUM') {
        endpoint = `/api/${assetType.toLowerCase()}/price`;
      } else if (assetType === 'CRYPTO') {
        endpoint = `/api/crypto/price?symbol=${symbol}`;
      } else {
        endpoint = `/api/stocks/price?symbol=${symbol}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success && result.data) {
        setLivePrice({
          price: result.data.price,
          change: result.data.change || 0,
          changePercent: result.data.changePercent || 0,
          currency: result.data.currency || 'USD',
          lastUpdate: Date.now(),
        });
      } else {
        setPriceError(result.error || 'Failed to fetch price');
      }
    } catch (error) {
      console.error('Error fetching live price:', error);
      setPriceError('Failed to fetch live price');
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  // Fetch price when symbol, type, or currency changes
  useEffect(() => {
    if (symbol && type) {
      fetchLivePrice(symbol, type);
    } else {
      setLivePrice(null);
    }
  }, [symbol, type, currency, fetchLivePrice]);

  // Check if edited position was deleted while form is open
  useEffect(() => {
    if (editPosition && positions.length > 0) {
      const positionExists = positions.some((p: Position) => p.id === editPosition.id);
      if (!positionExists && !positionDeleted) {
        setPositionDeleted(true);
        // Auto-close after showing message
        setTimeout(() => {
          onCancel?.();
        }, 3000);
      }
    }
  }, [positions, editPosition, positionDeleted, onCancel]);

  // Auto-refresh price every 30 seconds
  useEffect(() => {
    if (!symbol || !type) return;

    const interval = setInterval(() => {
      fetchLivePrice(symbol, type);
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol, type, fetchLivePrice]);

  // Debounced search function
  const searchAssets = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const upperQuery = query.toUpperCase();

    try {
      const results: SearchResult[] = [];

      // Check metal presets first
      const metalMatch = METAL_PRESETS.filter(
        m => m.symbol.includes(upperQuery) || m.name.toUpperCase().includes(upperQuery)
      );
      results.push(...metalMatch);

      // Check crypto presets
      const cryptoMatch = CRYPTO_PRESETS.filter(
        c => c.symbol.includes(upperQuery) || c.name.toUpperCase().includes(upperQuery)
      );
      results.push(...cryptoMatch);

      // Search stocks via API
      try {
        const stockResponse = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        const stockData = await stockResponse.json();
        if (stockData.success && stockData.data) {
          const stocks = stockData.data.map((s: any) => ({
            symbol: s.symbol,
            name: s.name,
            type: 'STOCK' as const,
          }));
          results.push(...stocks);
        }
      } catch (err) {
        console.warn('Stock search failed:', err);
      }

      // Search crypto via API
      try {
        const cryptoResponse = await fetch(`/api/crypto/search?q=${encodeURIComponent(query)}`);
        const cryptoData = await cryptoResponse.json();
        if (cryptoData.success && cryptoData.data) {
          const cryptos = cryptoData.data.map((c: any) => ({
            symbol: c.symbol,
            name: c.name,
            type: 'CRYPTO' as const,
          }));
          // Filter out already added presets
          const newCryptos = cryptos.filter(
            (c: SearchResult) => !CRYPTO_PRESETS.some(p => p.symbol === c.symbol)
          );
          results.push(...newCryptos);
        }
      } catch (err) {
        console.warn('Crypto search failed:', err);
      }

      // Remove duplicates based on symbol
      const uniqueResults = Array.from(
        new Map(results.map(r => [r.symbol, r])).values()
      );

      setSearchResults(uniqueResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchAssets(searchQuery);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchAssets]);

  const handleSelectResult = (result: SearchResult) => {
    setSymbol(result.symbol);
    setName(result.name);
    setType(result.type);
    setSearchQuery('');
    setShowSuggestions(false);

    // Auto-set currency based on type
    if (result.type === 'STOCK' && result.symbol.endsWith('.JK')) {
      setCurrency('IDR');
    } else if (result.type === 'CRYPTO') {
      setCurrency('USD');
    } else {
      setCurrency('USD');
    }

    // Clear previous price
    setLivePrice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol || !name || !quantity || !averageBuyPrice) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const position = {
      symbol: symbol.toUpperCase(),
      name,
      type,
      quantity: parseFloat(quantity),
      averageBuyPrice: parseFloat(averageBuyPrice),
      currency,
      notes,
    };

    if (editPosition && onUpdate) {
      onUpdate(editPosition.id, position);
    } else {
      onSubmit(position);
    }

    // Reset form
    if (!editPosition) {
      setSymbol('');
      setName('');
      setSearchQuery('');
      setQuantity('');
      setAverageBuyPrice('');
      setCurrency('USD');
      setType('STOCK');
      setLivePrice(null);
    }

    setIsSubmitting(false);
  };

  // Format price with currency conversion
  const getDisplayPrice = () => {
    if (!livePrice) return null;

    // Convert price if currencies differ
    const convertedPrice = livePrice.currency !== currency
      ? formatPriceInCurrency(livePrice.price, livePrice.currency)
      : formatPriceInCurrency(livePrice.price, currency);

    return {
      price: convertedPrice,
      change: livePrice.change,
      changePercent: livePrice.changePercent,
      currency: livePrice.currency,
    };
  };

  const displayPrice = getDisplayPrice();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Position Deleted Alert */}
      {positionDeleted && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Position No Longer Exists
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This position was deleted. The form will close automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Symbol Search with Autocomplete */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="symbol-search">
            {editPosition ? 'Symbol (can be edited)' : 'Search & Select Asset'} *
          </Label>
          <div className="relative mt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="symbol-search"
                placeholder="Search stocks, crypto, metals... (e.g., BBCA, XRP, GOLD)"
                value={searchQuery || symbol}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSymbol(e.target.value.toUpperCase());
                  if (e.target.value === '') {
                    setName('');
                    setLivePrice(null);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 pr-10"
              />
              {symbol && (
                <button
                  type="button"
                  onClick={() => {
                    setSymbol('');
                    setName('');
                    setSearchQuery('');
                    setType('STOCK');
                    setLivePrice(null);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  title="Clear symbol"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown - shown for both add and edit */}
            {showSuggestions && (searchQuery || searchResults.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {/* Group by type */}
                    {searchResults.some(r => r.type === 'CRYPTO') && (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-slate-500 px-2 mb-1">Cryptocurrency</p>
                        {searchResults.filter(r => r.type === 'CRYPTO').map((result) => (
                          <button
                            key={result.symbol}
                            type="button"
                            onClick={() => handleSelectResult(result)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <div>
                              <span className="font-medium text-sm">{result.symbol}</span>
                              <span className="text-slate-500 text-xs ml-2">{result.name}</span>
                            </div>
                            <Check className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.some(r => r.type === 'STOCK') && (
                      <div className="p-2 border-t dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 px-2 mb-1">Stocks</p>
                        {searchResults.filter(r => r.type === 'STOCK').map((result) => (
                          <button
                            key={result.symbol}
                            type="button"
                            onClick={() => handleSelectResult(result)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <div>
                              <span className="font-medium text-sm">{result.symbol}</span>
                              <span className="text-slate-500 text-xs ml-2 truncate max-w-[200px]">{result.name}</span>
                            </div>
                            <Check className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.some(r => ['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'].includes(r.type)) && (
                      <div className="p-2 border-t dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 px-2 mb-1">Precious Metals</p>
                        {searchResults.filter(r => ['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'].includes(r.type)).map((result) => (
                          <button
                            key={result.symbol}
                            type="button"
                            onClick={() => handleSelectResult(result)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <div>
                              <span className="font-medium text-sm">{result.symbol}</span>
                              <span className="text-slate-500 text-xs ml-2">{result.name}</span>
                            </div>
                            <Check className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : searchQuery ? (
                  <div className="p-4 text-center text-slate-500">
                    <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Asset Info with Live Price */}
      {symbol && name && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-lg">{symbol}</p>
                <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full font-medium">
                  {type}
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{name}</p>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchLivePrice(symbol, type)}
              disabled={isLoadingPrice}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
              title="Refresh price"
            >
              <RefreshCw className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isLoadingPrice ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Live Price Display */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            {isLoadingPrice && !livePrice ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-slate-500">Loading live price...</span>
              </div>
            ) : priceError ? (
              <div className="text-center py-2">
                <p className="text-sm text-red-600 dark:text-red-400">{priceError}</p>
              </div>
            ) : displayPrice ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {displayPrice.price}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center justify-end gap-1 ${displayPrice.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {displayPrice.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {displayPrice.changePercent >= 0 ? '+' : ''}{displayPrice.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Auto-refreshes every 30s
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Type (auto-detected but changeable) */}
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => {
            setType(value as typeof type);
            setLivePrice(null);
          }} disabled={!!editPosition}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GOLD">Gold (GOLD)</SelectItem>
              <SelectItem value="SILVER">Silver (SILVER)</SelectItem>
              <SelectItem value="PLATINUM">Platinum (PLATINUM)</SelectItem>
              <SelectItem value="PALLADIUM">Palladium (PALLADIUM)</SelectItem>
              <SelectItem value="CRYPTO">Cryptocurrency (CRYPTO)</SelectItem>
              <SelectItem value="STOCK">Stock (STOCK)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div>
          <Label htmlFor="currency">Currency *</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.0001"
            min="0"
            placeholder="e.g., 10, 0.5, 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        {/* Average Buy Price */}
        <div>
          <Label htmlFor="buyPrice">Average Buy Price ({currency}) *</Label>
          <Input
            id="buyPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder={currency === 'IDR' ? 'e.g., 5000' : 'e.g., 2000'}
            value={averageBuyPrice}
            onChange={(e) => setAverageBuyPrice(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>

      {/* Notes (Optional) */}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          placeholder="e.g., Long-term hold, Bought at dip"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !symbol}>
          {isSubmitting ? 'Saving...' : editPosition ? 'Update Position' : 'Add Position'}
        </Button>
      </div>

      {/* Quick Add Suggestions (only when not editing) */}
      {!editPosition && !symbol && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-slate-500 mb-3">Popular Assets:</p>
          <div className="space-y-3">
            {/* Crypto */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Cryptocurrency</p>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_PRESETS.slice(0, 6).map((preset) => (
                  <Button
                    key={preset.symbol}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectResult(preset)}
                    className="h-8"
                  >
                    {preset.symbol.replace('-USD', '')}
                  </Button>
                ))}
              </div>
            </div>
            {/* Metals */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Precious Metals</p>
              <div className="flex flex-wrap gap-2">
                {METAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.symbol}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectResult(preset)}
                    className="h-8"
                  >
                    {preset.symbol}
                  </Button>
                ))}
              </div>
            </div>
            {/* Indonesian Stocks */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Indonesian Stocks</p>
              <div className="flex flex-wrap gap-2">
                {['BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'ASII.JK', 'UNVR.JK'].map((sym) => (
                  <Button
                    key={sym}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSymbol(sym);
                      setSearchQuery('');
                      setName(sym);
                      setType('STOCK');
                      setCurrency('IDR');
                    }}
                    className="h-8"
                  >
                    {sym}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
