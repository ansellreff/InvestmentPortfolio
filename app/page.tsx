'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { TickerTape } from '@/components/market/TickerTape';
import { useCurrency } from '@/hooks/useCurrency';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';
import {
  Search, Plus, Star, TrendingUp, TrendingDown,
  Bitcoin, DollarSign, Coins, Gem, BarChart3, LineChart,
  Clock, Activity, ChevronRight, X, Loader2, ChevronDown
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useWatchlist } from '@/stores/useWatchlist';
import Link from 'next/link';

type InstrumentCategory = 'all' | 'crypto' | 'us-stocks' | 'indo-stocks' | 'metals';

interface LivePrice {
  price: number;
  currency: string;
  lastUpdate: number;
  change?: number;
  changePercent?: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX' | 'INDO_STOCK';
  exchange?: string;
  country?: string;
  marketCap?: number;
  marketCapRank?: number;
}

interface Instrument {
  symbol: string;
  name: string;
  type: 'CRYPTO' | 'STOCK' | 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
  category: InstrumentCategory;
  color: string;
  marketCap?: number;
  marketCapRank?: number;
}

const CATEGORIES: { id: InstrumentCategory; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'all', label: 'All Markets', icon: <BarChart3 className="h-5 w-5" />, color: 'text-slate-600', description: 'Browse all investment instruments' },
  { id: 'crypto', label: 'Cryptocurrencies', icon: <Bitcoin className="h-5 w-5" />, color: 'text-orange-500', description: 'Bitcoin, Ethereum, and more' },
  { id: 'us-stocks', label: 'US Stocks', icon: <DollarSign className="h-5 w-5" />, color: 'text-green-600', description: 'AAPL, GOOGL, TSLA, etc.' },
  { id: 'indo-stocks', label: 'Indonesian Stocks', icon: <Activity className="h-5 w-5" />, color: 'text-red-600', description: 'BBCA, BBRI, TLKM, etc.' },
  { id: 'metals', label: 'Precious Metals', icon: <Gem className="h-5 w-5" />, color: 'text-yellow-600', description: 'Gold, Silver, Platinum' },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stockPrices, setStockPrices] = useState<Record<string, LivePrice>>({});
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedSymbols, setLoadedSymbols] = useState<Set<string>>(new Set());
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Get all visible instrument symbols for price updates
  const visibleSymbols = instruments.map(i => i.symbol);

  const { selectedInstruments, addInstrument, removeInstrument } = useComparisonStore();
  const { items: watchlist, addItem: addToWatchlist, isInWatchlist } = useWatchlist();
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  // Optimized price updates - 10 second polling (no WebSocket to avoid errors)
  const { prices: realtimePrices } = useRealtimePrice(visibleSymbols, {
    enabled: visibleSymbols.length > 0,
    updateInterval: 10000 // 10 second updates
  });

  // Fetch instruments by category
  useEffect(() => {
    fetchInstruments();
    setHasMore(true);
    setLoadedSymbols(new Set());
  }, [selectedCategory]);

  const fetchInstruments = async (append = false) => {
    if (append) setLoadingMore(true);
    else setInitialLoading(true);

    try {
      // For metals, add fallback data directly since API might not return them
      if (selectedCategory === 'metals') {
        const metalInstruments: Instrument[] = [
          { symbol: 'GOLD', name: 'Gold Spot (XAU)', type: 'GOLD', category: 'metals', color: 'text-yellow-500' },
          { symbol: 'SILVER', name: 'Silver Spot (XAG)', type: 'SILVER', category: 'metals', color: 'text-slate-400' },
          { symbol: 'PLATINUM', name: 'Platinum Spot (XPT)', type: 'PLATINUM', category: 'metals', color: 'text-slate-300' },
          { symbol: 'PALLADIUM', name: 'Palladium Spot (XPD)', type: 'PALLADIUM', category: 'metals', color: 'text-slate-400' },
        ];

        if (append) {
          // Use functional setState to get current state
          setInstruments(prev => {
            const existingSymbols = new Set(prev.map(i => i.symbol));
            const newMetals = metalInstruments.filter(m => !existingSymbols.has(m.symbol));

            if (newMetals.length === 0) {
              // All metals already loaded, no changes
              return prev;
            }

            setLoadedSymbols(new Set([...existingSymbols, ...newMetals.map(m => m.symbol)]));
            newMetals.forEach(metal => fetchPrice(metal));

            return [...prev, ...newMetals];
          });
        } else {
          setInstruments(metalInstruments);
          setLoadedSymbols(new Set(metalInstruments.map(m => m.symbol)));
          metalInstruments.forEach(metal => fetchPrice(metal));
        }
        setInitialLoading(false);
        setLoadingMore(false);
        setHasMore(false); // No more metals to load
        return;
      }

      // Determine search type based on category
      let searchType = 'all';
      if (selectedCategory === 'crypto') searchType = 'crypto';
      else if (selectedCategory === 'indo-stocks') searchType = 'indo';
      else if (selectedCategory === 'us-stocks') searchType = 'stock';

      const response = await fetch(`/api/search?type=${searchType}&limit=100`);
      const result = await response.json();

      if (result.success && result.data) {
        const newInstruments: Instrument[] = result.data.map((item: SearchResult) => {
          let category: InstrumentCategory = 'us-stocks';
          let color = 'text-slate-700';
          let type: Instrument['type'] = 'STOCK';

          if (item.type === 'CRYPTO') {
            category = 'crypto';
            color = 'text-orange-500';
            type = 'CRYPTO';
          } else if (item.type === 'INDO_STOCK' || item.symbol.endsWith('.JK')) {
            category = 'indo-stocks';
            color = 'text-red-600';
            type = 'STOCK';
          }

          // Filter by selected category
          if (selectedCategory !== 'all' && category !== selectedCategory) {
            return null;
          }

          return {
            symbol: item.symbol,
            name: item.name,
            type,
            category,
            color,
            marketCap: item.marketCap,
            marketCapRank: item.marketCapRank,
          };
        }).filter((i: Instrument | null): i is Instrument => i !== null);

        // Sort by market cap (professional approach) - largest first
        const sorted = [...newInstruments].sort((a, b) => {
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
          // Alphabetical for instruments without market cap
          return a.symbol.localeCompare(b.symbol);
        });

        if (append) {
          // Filter out already-loaded instruments using the current instruments state
          setInstruments(prev => {
            const existingSymbols = new Set(prev.map(i => i.symbol));
            const newItems = sorted.filter(item => !existingSymbols.has(item.symbol));
            const toAdd = newItems.slice(0, 12);

            // If no new items, all instruments are exhausted
            if (toAdd.length === 0) {
              setHasMore(false);
              setLoadingMore(false);
              return prev;
            }

            // Update loadedSymbols
            setLoadedSymbols(new Set([...existingSymbols, ...toAdd.map(i => i.symbol)]));

            // Fetch prices for new items
            toAdd.forEach(inst => fetchPrice(inst));

            // Update hasMore based on remaining unique items
            const remainingUnique = newItems.length - toAdd.length;
            setHasMore(remainingUnique > 0);

            return [...prev, ...toAdd];
          });
        } else {
          const initialItems = sorted.slice(0, 12);
          setInstruments(initialItems);
          setLoadedSymbols(new Set(initialItems.map(i => i.symbol)));

          // Fetch prices for initial items
          initialItems.forEach(inst => fetchPrice(inst));

          // Check if there's more data
          setHasMore(newInstruments.length > 12);
        }

        // For append case, return early since we've already handled everything in the setState callback
        if (append) return;
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
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
        let searchType = 'all';
        if (selectedCategory === 'crypto') searchType = 'crypto';
        else if (selectedCategory === 'indo-stocks') searchType = 'indo';
        else if (selectedCategory === 'us-stocks') searchType = 'stock';

        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=10`);
        const result = await response.json();

        if (result.success) {
          setSearchResults(result.data || []);
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
  }, [searchQuery, selectedCategory]);

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

  // Fetch price for an instrument
  const fetchPrice = async (instrument: Instrument) => {
    if (loadingPrices.has(instrument.symbol)) return;

    setLoadingPrices(prev => new Set(prev).add(instrument.symbol));

    try {
      let endpoint = '';
      if (instrument.type === 'CRYPTO') {
        endpoint = `/api/crypto/price?symbol=${instrument.symbol}`;
      } else if (instrument.category === 'metals' || instrument.type === 'GOLD' || instrument.type === 'SILVER' || instrument.type === 'PLATINUM' || instrument.type === 'PALLADIUM') {
        const metalType = instrument.symbol.toLowerCase();
        endpoint = `/api/${metalType}/price`;
      } else {
        endpoint = `/api/stocks/price?symbol=${instrument.symbol}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success && result.data) {
        setStockPrices(prev => ({
          ...prev,
          [instrument.symbol]: {
            price: result.data.price,
            currency: result.data.currency || 'USD',
            lastUpdate: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error(`Error fetching price for ${instrument.symbol}:`, error);
    } finally {
      setLoadingPrices(prev => {
        const newSet = new Set(prev);
        newSet.delete(instrument.symbol);
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
      instruments.forEach(instrument => fetchPrice(instrument));
    }, 30000);
    return () => clearInterval(interval);
  }, [instruments]);

  // Merge real-time prices into stockPrices with flash animation
  useEffect(() => {
    Object.entries(realtimePrices).forEach(([symbol, data]) => {
      const prevPrice = stockPrices[symbol]?.price || 0;

      // Trigger flash animation if price changed
      if (data.price !== prevPrice && prevPrice > 0) {
        const direction = data.price > prevPrice ? 'up' : 'down';
        setFlashStates(prev => ({ ...prev, [symbol]: direction }));
        setTimeout(() => {
          setFlashStates(prev => ({ ...prev, [symbol]: null }));
        }, 500);
      }

      setStockPrices(prev => ({
        ...prev,
        [symbol]: {
          price: data.price,
          currency: data.currency || 'USD',
          lastUpdate: Date.now(),
          change: data.change,
          changePercent: data.changePercent,
        },
      }));
    });
  }, [realtimePrices]);

  const isSelected = (symbol: string) => selectedInstruments.some(i => i.symbol === symbol);

  const handleAddToComparison = (symbol: string, name: string, type: string) => {
    const price = stockPrices[symbol]?.price || 0;
    const currency = stockPrices[symbol]?.currency || 'USD';
    addInstrument({ symbol, name, type: type as any, price, currency });
  };

  const handleAddToWatchlist = (symbol: string, name: string, type: string) => {
    addToWatchlist({ symbol, name, type: type as any, addedAt: new Date().toISOString() });
  };

  const getInstrumentIcon = (type: string, category: InstrumentCategory) => {
    if (category === 'crypto' || type === 'CRYPTO') return <Bitcoin className="h-4 w-4" />;
    if (category === 'metals') return <Gem className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  const getCategoryBadge = (category: InstrumentCategory, symbol: string) => {
    if (category === 'crypto') return 'Crypto';
    if (category === 'indo-stocks' || symbol.endsWith('.JK')) return 'IDX';
    if (category === 'metals') return 'Metal';
    return 'US';
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    window.location.href = `/instrument/${result.symbol}`;
  };

  // Filter instruments by search query
  const filteredInstruments = instruments.filter(instrument => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      instrument.symbol.toLowerCase().includes(lowerQuery) ||
      instrument.name.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TickerTape />
      <Navigation />

      {/* User Welcome Bar */}
      {status === 'authenticated' && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
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
                  <Button variant="secondary" size="sm" className="h-8 bg-white text-blue-600 hover:bg-slate-100">
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
        {/* Hero Section */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Explore Investment Opportunities
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                Search thousands of cryptocurrencies, stocks, and precious metals. Select a category to browse.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/compare">
                <Button size="lg" className="gap-2">
                  <BarChart3 className="h-5 w-5" />
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
                placeholder={`Search in ${CATEGORIES.find(c => c.id === selectedCategory)?.label || 'all markets'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                className="pl-12 pr-10 h-14 text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
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
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-slate-600 dark:text-slate-400 text-sm">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.symbol}-${result.type}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                            result.type === 'CRYPTO' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                            result.symbol.endsWith('.JK') ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          }`}>
                            {getInstrumentIcon(result.type, result.type === 'CRYPTO' ? 'crypto' : 'us-stocks')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{result.symbol}</span>
                              <Badge variant="secondary" className="text-xs">
                                {result.type === 'CRYPTO' ? 'Crypto' :
                                 result.symbol.endsWith('.JK') ? 'IDX' : 'Stock'}
                              </Badge>
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
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No results found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Try the exact symbol (e.g., AAPL, BTC-USD, BBCA.JK)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Category Tabs */}
        <section className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery('');
                }}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
                  ${selectedCategory === category.id
                    ? `${category.color} bg-white dark:bg-slate-800 shadow-lg scale-105`
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-2">
            {CATEGORIES.find(c => c.id === selectedCategory)?.description}
          </p>
        </section>

        {/* Instruments Grid */}
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
          ) : filteredInstruments.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInstruments.map((instrument) => {
                  const priceData = stockPrices[instrument.symbol];
                  const isLoading = loadingPrices.has(instrument.symbol);
                  const isAdded = isSelected(instrument.symbol);
                  const isWatched = isInWatchlist(instrument.symbol);
                  const icon = getInstrumentIcon(instrument.type, instrument.category);
                  const flashDir = flashStates[instrument.symbol];
                  const change = priceData?.changePercent || 0;
                  const isUp = change >= 0;

                  return (
                    <Card
                      key={instrument.symbol}
                      className={`group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 ${
                        flashDir === 'up' ? 'bg-green-50/50 dark:bg-green-900/10' :
                        flashDir === 'down' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${instrument.color.replace('text-', 'bg-opacity-10 bg-')} ${instrument.color}`}>
                              {icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">{instrument.symbol}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {instrument.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryBadge(instrument.category, instrument.symbol)}
                          </Badge>
                        </div>

                        <div className="mb-4">
                          {isLoading ? (
                            <div className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                          ) : priceData ? (
                            <div>
                              <p className={`text-2xl font-bold tabular-nums transition-colors ${
                                flashDir === 'up' ? 'text-green-600' :
                                flashDir === 'down' ? 'text-red-600' : 'text-slate-900 dark:text-white'
                              }`}>
                                {formatPriceInCurrency(priceData.price, priceData.currency)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className={`text-xs font-medium flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {isUp ? '+' : ''}{change?.toFixed(2) || '0.00'}%
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(priceData.lastUpdate).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm">Loading...</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddToWatchlist(instrument.symbol, instrument.name, instrument.type)}
                            disabled={!mounted || isWatched}
                            className={`flex-1 ${mounted && isWatched ? 'text-yellow-600' : ''}`}
                          >
                            <Star className={`h-4 w-4 ${mounted && isWatched ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant={mounted && isAdded ? 'destructive' : 'default'}
                            onClick={() => isAdded ? removeInstrument(instrument.symbol) : handleAddToComparison(instrument.symbol, instrument.name, instrument.type)}
                            className="flex-1"
                          >
                            {mounted && isAdded ? <>Added</> : <><Plus className="h-4 w-4 mr-1" />Add</>}
                          </Button>
                          <Link href={`/instrument/${instrument.symbol}`} className="flex-1">
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
                    onClick={() => fetchInstruments(true)}
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
              <Search className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No instruments found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try selecting a different category or adjusting your search
              </p>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mt-12 grid md:grid-cols-4 gap-4">
          <Link href="/simulate" className="group">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Simulator</h3>
                  <p className="text-xs text-slate-500">Investment calculator</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600" />
              </div>
            </Card>
          </Link>

          <Link href="/analyze" className="group">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Analysis</h3>
                  <p className="text-xs text-slate-500">Technical indicators</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              </div>
            </Card>
          </Link>

          <Link href="/market" className="group">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Market</h3>
                  <p className="text-xs text-slate-500">Top movers</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-green-600" />
              </div>
            </Card>
          </Link>

          <Link href="/portfolio" className="group">
            <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Portfolio</h3>
                  <p className="text-xs text-slate-500">Track positions</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-orange-600" />
              </div>
            </Card>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <p>© 2024 Investment Advisor. Professional trading & analysis platform.</p>
            <div className="flex items-center gap-6">
              <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare</Link>
              <Link href="/analyze" className="hover:text-blue-600 transition-colors">Analysis</Link>
              <Link href="/market" className="hover:text-blue-600 transition-colors">Markets</Link>
              <Link href="/portfolio" className="hover:text-blue-600 transition-colors">Portfolio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
