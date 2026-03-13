'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { TickerTape } from '@/components/market/TickerTape';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Search, Plus, Star, Activity, TrendingUp, LineChart,
  Clock, ChevronRight, X, Loader2, ChevronDown, TrendingUp as TrendingIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useWatchlist } from '@/stores/useWatchlist';
import Link from 'next/link';

interface LivePrice {
  price: number;
  currency: string;
  lastUpdate: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'INDO_STOCK';
  marketCap?: number;
  marketCapRank?: number;
}

interface Stock {
  symbol: string;
  name: string;
  marketCap?: number;
  marketCapRank?: number;
}

export default function IndoMarketPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stockPrices, setStockPrices] = useState<Record<string, LivePrice>>({});
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedSymbols, setLoadedSymbols] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const { selectedInstruments, addInstrument, removeInstrument } = useComparisonStore();
  const { items: watchlist, addItem: addToWatchlist, isInWatchlist } = useWatchlist();
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  // Fetch stocks on mount
  useEffect(() => {
    fetchStocks();
    setHasMore(true);
  }, []);

  const fetchStocks = async (append = false) => {
    if (append) setLoadingMore(true);
    else setInitialLoading(true);

    try {
      const response = await fetch('/api/search?type=indo&limit=50');
      const result = await response.json();

      if (result.success && result.data) {
        const newStocks: Stock[] = result.data
          .filter((item: SearchResult) => {
            // Only include Indonesian stocks
            return item.symbol.endsWith('.JK') || item.type === 'INDO_STOCK';
          })
          .map((item: SearchResult) => ({
            symbol: item.symbol,
            name: item.name,
            marketCap: item.marketCap,
            marketCapRank: item.marketCapRank,
          }));

        // Sort by market cap (professional approach) - largest first
        const sorted = [...newStocks].sort((a, b) => {
          // Instruments with market cap rank first, sorted by rank (1 = highest)
          if (a.marketCapRank && b.marketCapRank) {
            return a.marketCapRank - b.marketCapRank;
          }
          // Instruments with market cap (no rank), sort by cap value descending
          if (a.marketCap && b.marketCap) {
            return b.marketCap - a.marketCap;
          }
          // Instruments with market cap/rank before those without
          if (a.marketCapRank || a.marketCap) return -1;
          if (b.marketCapRank || b.marketCap) return 1;
          // Alphabetical for stocks without market cap
          return a.symbol.localeCompare(b.symbol);
        });

        if (append) {
          // Use functional setState to get current state
          setStocks(prev => {
            const existingSymbols = new Set(prev.map(s => s.symbol));
            const newItems = sorted.filter(item => !existingSymbols.has(item.symbol));
            const toAdd = newItems.slice(0, 12);

            // If no new items, all stocks are exhausted
            if (toAdd.length === 0) {
              setHasMore(false);
              setLoadingMore(false);
              return prev;
            }

            setLoadedSymbols(new Set([...existingSymbols, ...toAdd.map(s => s.symbol)]));

            // Fetch prices for new items
            toAdd.forEach(stock => fetchPrice(stock));

            // Update hasMore based on remaining unique items
            const remainingUnique = newItems.length - toAdd.length;
            setHasMore(remainingUnique > 0);

            return [...prev, ...toAdd];
          });
        } else {
          const initialItems = sorted.slice(0, 12);
          setStocks(initialItems);
          setLoadedSymbols(new Set(initialItems.map(s => s.symbol)));

          // Fetch prices for initial items
          initialItems.forEach(stock => fetchPrice(stock));

          // Check if there's more data
          setHasMore(newStocks.length > 12);
        }

        // For append case, return early since we've already handled everything in the setState callback
        if (append) return;
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      if (append) setLoadingMore(false);
      else setInitialLoading(false);
    }
  };

  // Real-time search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=indo&limit=10`);
        const result = await response.json();

        if (result.success) {
          setSearchResults(result.data?.filter((r: SearchResult) => {
            return r.symbol.endsWith('.JK') || r.type === 'INDO_STOCK';
          }) || []);
          setShowSearchDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch price for a stock
  const fetchPrice = async (stock: Stock) => {
    if (loadingPrices.has(stock.symbol)) return;

    setLoadingPrices(prev => new Set(prev).add(stock.symbol));

    try {
      const response = await fetch(`/api/stocks/price?symbol=${stock.symbol}`);
      const result = await response.json();

      if (result.success && result.data) {
        setStockPrices(prev => ({
          ...prev,
          [stock.symbol]: {
            price: result.data.price,
            currency: result.data.currency || 'IDR',
            lastUpdate: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error(`Error fetching price for ${stock.symbol}:`, error);
    } finally {
      setLoadingPrices(prev => {
        const newSet = new Set(prev);
        newSet.delete(stock.symbol);
        return newSet;
      });
    }
  };

  // Track hydration state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      stocks.forEach(stock => fetchPrice(stock));
    }, 30000);
    return () => clearInterval(interval);
  }, [stocks]);

  const isSelected = (symbol: string) => selectedInstruments.some(i => i.symbol === symbol);

  const handleAddToComparison = (symbol: string, name: string) => {
    const price = stockPrices[symbol]?.price || 0;
    const currency = stockPrices[symbol]?.currency || 'IDR';
    addInstrument({ symbol, name, type: 'STOCK', price, currency });
  };

  const handleAddToWatchlist = (symbol: string, name: string) => {
    addToWatchlist({ symbol, name, type: 'STOCK', addedAt: new Date().toISOString() });
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    window.location.href = `/instrument/${result.symbol}`;
  };

  // Filter stocks by search query
  const filteredStocks = stocks.filter(stock => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(lowerQuery) ||
      stock.name.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TickerTape />
      <Navigation />

      {/* User Welcome Bar */}
      {status === 'authenticated' && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                </div>
                <p className="font-medium text-sm">Welcome back, {session?.user?.name?.split(' ')[0] || 'Investor'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="secondary" size="sm" className="h-8 bg-white text-red-600 hover:bg-slate-100">
                    Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
                  <Activity className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Indonesian Stock Market (IDX)
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Real-time prices for Indonesia Stock Exchange
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/compare">
                <Button size="lg" className="gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compare ({mounted ? selectedInstruments.length : 0})
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6 max-w-2xl" ref={searchDropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search Indonesian stocks (e.g., BBCA, BBRI, Telkom)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                className="pl-12 pr-10 h-14 text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchQuery.length >= 2 && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-hidden">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-red-600 mr-2" />
                    <span className="text-slate-600 dark:text-slate-400 text-sm">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 transition-transform group-hover:scale-110">
                            <TrendingIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{result.symbol}</span>
                              <Badge className="text-xs bg-red-100 text-red-600">IDX</Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                              {result.name}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center px-4">
                    <Search className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No stocks found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Try the exact symbol (e.g., BBCA.JK, BBRI.JK)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Stocks Grid */}
        <section>
          {initialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStocks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStocks.map((stock) => {
                  const priceData = stockPrices[stock.symbol];
                  const isLoading = loadingPrices.has(stock.symbol);
                  const isAdded = isSelected(stock.symbol);
                  const isWatched = isInWatchlist(stock.symbol);

                  return (
                    <Card
                      key={stock.symbol}
                      className="group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 transition-transform group-hover:scale-110">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">{stock.symbol}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {stock.name}
                              </p>
                            </div>
                          </div>
                          <Badge className="text-xs bg-red-100 text-red-600">IDX</Badge>
                        </div>

                        <div className="mb-4">
                          {isLoading ? (
                            <div className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                          ) : priceData ? (
                            <div>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {formatPriceInCurrency(priceData.price, priceData.currency)}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(priceData.lastUpdate).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm">Loading...</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddToWatchlist(stock.symbol, stock.name)}
                            disabled={!mounted || isWatched}
                            className={`flex-1 ${mounted && isWatched ? 'text-yellow-600' : ''}`}
                          >
                            <Star className={`h-4 w-4 ${mounted && isWatched ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant={mounted && isAdded ? 'destructive' : 'default'}
                            onClick={() => isAdded ? removeInstrument(stock.symbol) : handleAddToComparison(stock.symbol, stock.name)}
                            className="flex-1"
                          >
                            {mounted && isAdded ? <>Added</> : <><Plus className="h-4 w-4 mr-1" />Add</>}
                          </Button>
                          <Link href={`/instrument/${stock.symbol}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <LineChart className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => fetchStocks(true)}
                    disabled={loadingMore}
                    variant="outline"
                    size="lg"
                    className="gap-2 min-w-[160px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <Activity className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Indonesian stocks found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your search
              </p>
            </Card>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <p>© 2024 Investment Advisor. Professional trading & analysis platform.</p>
            <div className="flex items-center gap-6">
              <Link href="/market" className="hover:text-blue-600 transition-colors">Markets</Link>
              <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare</Link>
              <Link href="/portfolio" className="hover:text-blue-600 transition-colors">Portfolio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
