'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { TickerTape } from '@/components/market/TickerTape';
import { useCurrency } from '@/hooks/useCurrency';
import { Gem, TrendingUp, LineChart, Clock, Plus, Star, ChevronDown, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useWatchlist } from '@/stores/useWatchlist';
import Link from 'next/link';

interface LivePrice {
  price: number;
  currency: string;
  lastUpdate: number;
}

interface Metal {
  symbol: string;
  name: string;
  type: 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
  color: string;
}

const METALS: Metal[] = [
  { symbol: 'GOLD', name: 'Gold Spot (XAU)', type: 'GOLD', color: 'text-yellow-500' },
  { symbol: 'SILVER', name: 'Silver Spot (XAG)', type: 'SILVER', color: 'text-slate-400' },
  { symbol: 'PLATINUM', name: 'Platinum Spot (XPT)', type: 'PLATINUM', color: 'text-slate-300' },
  { symbol: 'PALLADIUM', name: 'Palladium Spot (XPD)', type: 'PALLADIUM', color: 'text-slate-400' },
];

export default function MetalsMarketPage() {
  const { data: session, status } = useSession();
  const [stockPrices, setStockPrices] = useState<Record<string, LivePrice>>({});
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  const { selectedInstruments, addInstrument, removeInstrument } = useComparisonStore();
  const { isInWatchlist, addItem: addToWatchlist } = useWatchlist();
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  // Fetch prices on mount
  useEffect(() => {
    METALS.forEach(metal => fetchPrice(metal));
    setMounted(true);
  }, []);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      METALS.forEach(metal => fetchPrice(metal));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrice = async (metal: Metal) => {
    if (loadingPrices.has(metal.symbol)) return;

    setLoadingPrices(prev => new Set(prev).add(metal.symbol));

    try {
      const response = await fetch(`/api/${metal.type.toLowerCase()}/price`);
      const result = await response.json();

      if (result.success && result.data) {
        setStockPrices(prev => ({
          ...prev,
          [metal.symbol]: {
            price: result.data.price,
            currency: result.data.currency || 'USD',
            lastUpdate: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error(`Error fetching price for ${metal.symbol}:`, error);
    } finally {
      setLoadingPrices(prev => {
        const newSet = new Set(prev);
        newSet.delete(metal.symbol);
        return newSet;
      });
    }
  };

  const isSelected = (symbol: string) => selectedInstruments.some(i => i.symbol === symbol);

  const handleAddToComparison = (symbol: string, name: string, type: string) => {
    const price = stockPrices[symbol]?.price || 0;
    const currency = stockPrices[symbol]?.currency || 'USD';
    addInstrument({ symbol, name, type: type as any, price, currency });
  };

  const handleAddToWatchlist = (symbol: string, name: string, type: string) => {
    addToWatchlist({ symbol, name, type: type as any, addedAt: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TickerTape />
      <Navigation />

      {/* User Welcome Bar */}
      {status === 'authenticated' && (
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
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
                  <Button variant="secondary" size="sm" className="h-8 bg-white text-yellow-600 hover:bg-slate-100">
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
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                  <Gem className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Precious Metals Market
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Real-time prices for Gold, Silver, Platinum & Palladium
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
        </section>

        {/* Metals Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {METALS.map((metal) => {
              const priceData = stockPrices[metal.symbol];
              const isLoading = loadingPrices.has(metal.symbol);
              const isAdded = isSelected(metal.symbol);
              const isWatched = isInWatchlist(metal.symbol);

              return (
                <Card
                  key={metal.symbol}
                  className="group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-600"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${metal.color.replace('text-', 'bg-opacity-10 bg-')} ${metal.color} transition-transform group-hover:scale-110`}>
                          <Gem className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-900 dark:text-white">{metal.symbol}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {metal.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      {isLoading ? (
                        <div className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                      ) : priceData ? (
                        <div>
                          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            {formatPriceInCurrency(priceData.price, priceData.currency)}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {new Date(priceData.lastUpdate).toLocaleTimeString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400">Loading...</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddToWatchlist(metal.symbol, metal.name, metal.type)}
                        disabled={!mounted || isWatched}
                        className={`flex-1 ${mounted && isWatched ? 'text-yellow-600' : ''}`}
                      >
                        <Star className={`h-4 w-4 ${mounted && isWatched ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant={mounted && isAdded ? 'destructive' : 'default'}
                        onClick={() => isAdded ? removeInstrument(metal.symbol) : handleAddToComparison(metal.symbol, metal.name, metal.type)}
                        className="flex-1"
                      >
                        {mounted && isAdded ? <>Added</> : <><Plus className="h-4 w-4 mr-1" />Add</>}
                      </Button>
                      <Link href={`/instrument/${metal.symbol}`} className="flex-1">
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
        </section>

        {/* Quick Info */}
        <section className="mt-12">
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <Gem className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  About Precious Metals Trading
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Precious metals are often considered safe-haven assets during economic uncertainty. Gold is the most traded precious metal,
                  followed by silver. Platinum and palladium are primarily industrial metals with significant trading volumes.
                  Prices are quoted in USD per troy ounce.
                </p>
              </div>
            </div>
          </Card>
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
