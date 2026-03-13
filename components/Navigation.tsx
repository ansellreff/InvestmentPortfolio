'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { UserMenu } from '@/components/auth/UserMenu'
import { TrendingUp, RefreshCw, Calculator, LayoutGrid, BarChart3, Wallet, ChevronDown, Bitcoin, DollarSign, Gem, Activity, PieChart as PieChartIcon } from 'lucide-react'
import { useComparisonStore } from '@/stores/useComparisonStore'

interface NavigationProps {
  onRefresh?: () => void
  refreshing?: boolean
}

export function Navigation({ onRefresh, refreshing = false }: NavigationProps) {
  const pathname = usePathname()
  const { selectedInstruments } = useComparisonStore()
  const [mounted, setMounted] = useState(false)
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false)
  const [portfolioDropdownOpen, setPortfolioDropdownOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { href: '/simulate', label: 'Simulate', icon: Calculator },
    { href: '/compare', label: 'Compare', icon: LayoutGrid, showCount: true },
    { href: '/analyze', label: 'Analysis', icon: BarChart3 },
  ]

  const portfolioSubPages = [
    { href: '/portfolio', label: 'My Portfolio', icon: Wallet },
    { href: '/portfolio/analysis', label: 'Analysis & Charts', icon: PieChartIcon },
  ]

  const marketCategories = [
    { href: '/market', label: 'All Markets', icon: Activity },
    { href: '/market/crypto', label: 'Cryptocurrencies', icon: Bitcoin },
    { href: '/market/stocks', label: 'US Stocks', icon: DollarSign },
    { href: '/market/indo', label: 'Indonesian Stocks', icon: TrendingUp },
    { href: '/market/metals', label: 'Precious Metals', icon: Gem },
  ]

  const isPortfolioActive = pathname?.startsWith('/portfolio')
  const isMarketActive = pathname?.startsWith('/market')

  return (
    <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                  Investment Advisor
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Professional trading & analysis platform</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <HeaderCurrencySelector />
            <ThemeToggle />
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                title="Refresh all data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {/* Market Dropdown */}
            <div className="relative">
              <Button
                variant={isMarketActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setMarketDropdownOpen(!marketDropdownOpen)
                  setPortfolioDropdownOpen(false)
                }}
                className="gap-1"
              >
                <Activity className="h-4 w-4" />
                Market
                <ChevronDown className={`h-3 w-3 transition-transform ${marketDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {marketDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                  {marketCategories.map((category) => {
                    const Icon = category.icon
                    const isActive = pathname === category.href

                    return (
                      <Link
                        key={category.href}
                        href={category.href}
                        onClick={() => setMarketDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {category.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Portfolio Dropdown */}
            <div className="relative">
              <Button
                variant={isPortfolioActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPortfolioDropdownOpen(!portfolioDropdownOpen)
                  setMarketDropdownOpen(false)
                }}
                className="gap-1"
              >
                <Wallet className="h-4 w-4" />
                Portfolio
                <ChevronDown className={`h-3 w-3 transition-transform ${portfolioDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {portfolioDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                  {portfolioSubPages.map((page) => {
                    const Icon = page.icon
                    const isActive = pathname === page.href

                    return (
                      <Link
                        key={page.href}
                        href={page.href}
                        onClick={() => setPortfolioDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {page.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon
              const count = link.showCount ? (mounted ? selectedInstruments.length : 0) : 0
              const isActive = pathname === link.href

              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMarketDropdownOpen(false)
                    setPortfolioDropdownOpen(false)
                  }}
                >
                  <Link href={link.href}>
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                    {link.showCount && count > 0 && ` (${count})`}
                  </Link>
                </Button>
              )
            })}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
