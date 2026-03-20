'use client'

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/Navigation"
import { AlertsList } from "@/components/alerts/AlertsList"
import { CompactPriceDisplay } from "@/components/market/PriceDisplay"
import { TrendingUp, Wallet, Star, BarChart3, DollarSign, ArrowUpRight, ArrowDownRight, UserCircle, Settings, RefreshCw } from "lucide-react"
import { useCurrency } from "@/hooks/useCurrency"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"
import { usePortfolioStore } from "@/stores/usePortfolioStore"
import { useWatchlist } from "@/stores/useWatchlist"

interface EnrichedPosition {
  symbol: string
  name: string
  type: string
  quantity: number
  avgBuyPrice: number
  currency: string
  currentPrice: number
  priceCurrency: string
  currentValue: number
  costBasis: number
  profitLoss: number
  profitLossPercent: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // Use stores for portfolio and watchlist - consistent across all pages
  const { positions, initializePortfolio } = usePortfolioStore()
  const { items: watchlist } = useWatchlist()

  // Get currency functions
  const { formatPrice, formatPriceRaw, targetCurrency, convertPrice, isLoading: currencyLoading } = useCurrency()

  // Combined loading state
  const isLoading = currencyLoading

  // Collect all symbols for real-time price updates
  const allSymbols = [
    ...positions.map(p => p.symbol),
    ...watchlist.map(w => w.symbol)
  ]

  // Optimized price updates - 10 second polling
  const { prices: realtimePrices } = useRealtimePrice(allSymbols, {
    enabled: allSymbols.length > 0,
    updateInterval: 10000
  })

  // Initialize portfolio from database on mount
  useEffect(() => {
    if (status === "authenticated") {
      initializePortfolio()
    }
  }, [status, initializePortfolio])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Enrich portfolio positions with price data
  const enrichedPositions: EnrichedPosition[] = useMemo(() => {
    return positions.map((position) => {
      const priceData = realtimePrices[position.symbol]
      const currentPrice = priceData?.price || position.averageBuyPrice
      const priceCurrency = priceData?.currency || position.currency

      const currentValue = currentPrice * position.quantity
      const costBasis = position.averageBuyPrice * position.quantity
      const profitLoss = currentValue - costBasis
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0

      return {
        symbol: position.symbol,
        name: position.name,
        type: position.type,
        quantity: position.quantity,
        avgBuyPrice: position.averageBuyPrice,
        currency: position.currency,
        currentPrice,
        priceCurrency,
        currentValue,
        costBasis,
        profitLoss,
        profitLossPercent,
      }
    })
  }, [positions, realtimePrices])

  // Calculate total portfolio value in target currency
  const portfolioValue = useMemo((): number => {
    return enrichedPositions.reduce((total, position) => {
      const converted = convertPrice(position.currentValue, position.priceCurrency)
      return total + converted.price
    }, 0)
  }, [enrichedPositions, convertPrice])

  // Calculate total cost in target currency
  const totalCost = useMemo((): number => {
    return enrichedPositions.reduce((total, position) => {
      const converted = convertPrice(position.costBasis, position.currency)
      return total + converted.price
    }, 0)
  }, [enrichedPositions, convertPrice])

  // Calculate P&L
  const totalPnL = useMemo((): number => portfolioValue - totalCost, [portfolioValue, totalCost])
  const totalPnLPercent = useMemo((): number => totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0, [totalPnL, totalCost])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Re-sync from database
      await initializePortfolio()
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setRefreshing(false)
    }
  }, [initializePortfolio])

  // Show loading state while checking auth
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation onRefresh={handleRefresh} refreshing={refreshing} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Currency indicator */}
        <div className="flex justify-end">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Displaying values in: <span className="font-bold text-slate-700 dark:text-slate-300">{targetCurrency}</span>
          </div>
        </div>

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {session?.user?.name || "Investor"}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Here's an overview of your investment portfolio and watchlist
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="default">
              <a href="/profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                My Profile
              </a>
            </Button>
            <Button asChild variant="outline" size="default">
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Portfolio Value</CardDescription>
              <CardTitle className="text-2xl">
                {formatPriceRaw(portfolioValue)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Cost</CardDescription>
              <CardTitle className="text-2xl">
                {formatPriceRaw(totalCost)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total P&L</CardDescription>
              <CardTitle className={`text-2xl flex items-center gap-2 ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalPnL >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                {formatPriceRaw(Math.abs(totalPnL))}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>P&L %</CardDescription>
              <CardTitle className={`text-2xl flex items-center gap-2 ${totalPnLPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalPnLPercent >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                {Math.abs(totalPnLPercent).toFixed(2)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Positions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Portfolio Positions
                  </CardTitle>
                  <CardDescription>{positions.length} positions</CardDescription>
                </div>
                <Button asChild size="sm">
                  <a href="/portfolio">Manage</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No positions yet</p>
                  <Button asChild className="mt-4" size="sm">
                    <a href="/portfolio">Add Position</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrichedPositions.slice(0, 5).map((position) => {
                    // Convert values to target currency for display
                    const convertedValue = convertPrice(position.currentValue, position.priceCurrency)
                    const convertedCost = convertPrice(position.costBasis, position.currency)
                    const pnl = convertedValue.price - convertedCost.price

                    return (
                      <div key={position.symbol} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-800 transition-all hover:shadow-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{position.symbol}</p>
                            {position.profitLossPercent !== 0 && (
                              <span className={`text-xs font-medium ${position.profitLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {position.profitLossPercent >= 0 ? "+" : ""}{position.profitLossPercent.toFixed(2)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {position.quantity} shares @ {formatPrice(position.avgBuyPrice, position.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <CompactPriceDisplay
                            price={convertedValue.price}
                            changePercent={position.profitLossPercent}
                            currency=""
                          />
                          <p className={`text-xs mt-1 ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                            P&L: {pnl >= 0 ? "+" : ""}{formatPriceRaw(Math.abs(pnl))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {positions.length > 5 && (
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <a href="/portfolio">View All {positions.length} Positions</a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Watchlist
                  </CardTitle>
                  <CardDescription>{watchlist.length} items</CardDescription>
                </div>
                <Button asChild size="sm">
                  <a href="/">Add More</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No watchlist items</p>
                  <Button asChild className="mt-4" size="sm">
                    <a href="/">Browse Markets</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.slice(0, 5).map((item) => {
                    const priceData = realtimePrices[item.symbol]
                    const change = priceData?.changePercent || 0
                    const itemCurrency = priceData?.currency || (item.symbol.includes('.JK') ? 'IDR' : 'USD')
                    const currentPrice = priceData?.price || 0

                    return (
                      <div key={item.symbol} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-800 transition-all hover:shadow-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.symbol}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{item.name}</p>
                        </div>
                        <div className="text-right">
                          {currentPrice > 0 ? (
                            <CompactPriceDisplay
                              price={currentPrice}
                              changePercent={change}
                              currency={itemCurrency === 'USD' ? '$' : itemCurrency === 'IDR' ? 'Rp' : ''}
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {watchlist.length > 5 && (
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <a href="/">View All {watchlist.length} Items</a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Alerts */}
          <AlertsList />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <a href="/profile">
                  <UserCircle className="h-6 w-6 mb-2" />
                  My Profile
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <a href="/portfolio">
                  <Wallet className="h-6 w-6 mb-2" />
                  Portfolio
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <a href="/simulate">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Simulate
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <a href="/compare">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Compare
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
