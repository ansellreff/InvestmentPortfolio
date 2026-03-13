'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/hooks/useCurrency';

interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: 'GAINER' | 'LOSER';
}

export function TopMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice: formatPriceInCurrency } = useCurrency();

  useEffect(() => {
    const fetchTopMovers = async () => {
      try {
        setLoading(true);

        // Fetch real-time data for popular Indonesian stocks and gold
        const symbols = [
          'GOLD',
          'BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'ASII.JK', 'UNVR.JK',
          'ICBP.JK', 'INDF.JK', 'ADRO.JK', 'ANTM.JK'
        ];

        const results: Mover[] = [];

        for (const symbol of symbols) {
          try {
            const endpoint = symbol === 'GOLD'
              ? '/api/gold/price'
              : `/api/stocks/price?symbol=${symbol}`;

            const response = await fetch(endpoint);
            const result = await response.json();

            if (result.success && result.data) {
              const data = result.data;
              const changePercent = data.changePercent || 0;

              results.push({
                symbol: data.symbol || symbol,
                name: data.name || symbol,
                price: data.price || 0,
                change: data.change || 0,
                changePercent,
                currency: data.currency || (symbol.includes('.JK') ? 'IDR' : 'USD'),
                type: changePercent >= 0 ? 'GAINER' : 'LOSER',
              });
            }
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
          }
        }

        // Sort and categorize by change percent
        const sorted = results.sort((a, b) => b.changePercent - a.changePercent);

        setGainers(sorted.filter(m => m.changePercent > 0).slice(0, 3));
        setLosers(sorted.filter(m => m.changePercent < 0).slice(0, 3));
      } catch (error) {
        console.error('Error fetching top movers:', error);
        // Fallback to demo data if API fails
        const demoGainers: Mover[] = [
          { symbol: 'GOLD', name: 'Gold', price: 2845.50, change: 34.20, changePercent: 1.2, currency: 'USD', type: 'GAINER' },
          { symbol: 'BBCA.JK', name: 'Bank Central Asia', price: 10250, change: 50, changePercent: 0.5, currency: 'IDR', type: 'GAINER' },
          { symbol: 'TLKM.JK', name: 'Telkom Indonesia', price: 3750, change: 40, changePercent: 1.1, currency: 'IDR', type: 'GAINER' },
        ];

        const demoLosers: Mover[] = [
          { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia', price: 5400, change: -15, changePercent: -0.3, currency: 'IDR', type: 'LOSER' },
          { symbol: 'UNVR.JK', name: 'Unilever Indonesia', price: 4850, change: -25, changePercent: -0.5, currency: 'IDR', type: 'LOSER' },
          { symbol: 'SILVER', name: 'Silver', price: 32.15, change: -0.28, changePercent: -0.9, currency: 'USD', type: 'LOSER' },
        ];

        setGainers(demoGainers);
        setLosers(demoLosers);
      } finally {
        setLoading(false);
      }
    };

    fetchTopMovers();

    // Listen for global refresh event
    const handleRefreshEvent = () => {
      fetchTopMovers();
    };
    window.addEventListener('refresh-all-prices', handleRefreshEvent);
    return () => {
      window.removeEventListener('refresh-all-prices', handleRefreshEvent);
    };
  }, []);

  const MoverCard = ({ mover }: { mover: Mover }) => (
    <Link href={`/instrument/${mover.symbol}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm">{mover.symbol}</span>
              <Badge variant={mover.type === 'GAINER' ? 'default' : 'destructive'} className="text-xs">
                {mover.type === 'GAINER' ? 'Top Gainer' : 'Top Loser'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 truncate">{mover.name}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">{formatPriceInCurrency(mover.price, mover.currency)}</p>
            <p
              className={`text-xs font-medium flex items-center justify-end gap-1 ${
                mover.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {mover.changePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {mover.changePercent >= 0 ? '+' : ''}
              {mover.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );

  const MoverCardSkeleton = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-20 mb-1 ml-auto" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Gainers
          </h2>
          <Link href="/market/gainers" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            <>
              <MoverCardSkeleton />
              <MoverCardSkeleton />
              <MoverCardSkeleton />
            </>
          ) : gainers.length > 0 ? (
            gainers.map((mover) => <MoverCard key={mover.symbol} mover={mover} />)
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No gainers available</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Top Losers
          </h2>
          <Link href="/market/losers" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            <>
              <MoverCardSkeleton />
              <MoverCardSkeleton />
              <MoverCardSkeleton />
            </>
          ) : losers.length > 0 ? (
            losers.map((mover) => <MoverCard key={mover.symbol} mover={mover} />)
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No losers available</p>
          )}
        </div>
      </div>
    </div>
  );
}
