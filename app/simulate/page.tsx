'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimulationResults } from '@/components/simulation/SimulationResults';
import { SimulationComparison } from '@/components/simulation/SimulationComparison';
import { PortfolioForecastResults } from '@/components/simulation/PortfolioForecastResults';
import { TrendingUp, Calculator, ArrowRight, Play, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import { HeaderCurrencySelector } from '@/components/ui/HeaderCurrencySelector';
import { Navigation } from '@/components/Navigation';
import { useCurrencyStore } from '@/stores/useCurrencyStore';
import { usePortfolioStore, type Position } from '@/stores/usePortfolioStore';

interface SimulationParams {
  symbol: string;
  name: string;
  type: string;
  investmentAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  frequency: 'onetime' | 'monthly' | 'weekly';
}

interface SimulationResult {
  symbol: string;
  name: string;
  type: string;
  initialInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalUnits: number;
  avgPricePerUnit: number;
  currentPrice: number;
  currency: string;
  historicalData: Array<{ date: string; price: number; value: number }>;
}

export default function SimulatePage() {
  const router = useRouter();
  const { currency: globalCurrency } = useCurrencyStore();
  const [params, setParams] = useState<SimulationParams[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [forecastHorizon, setForecastHorizon] = useState<30 | 90 | 180 | 365 | 730 | 1095 | 1460 | 1825 | 3650>(365);

  // Add new simulation parameter
  const addSimulation = () => {
    setParams([
      ...params,
      {
        symbol: '',
        name: '',
        type: 'STOCK',
        investmentAmount: 10000,
        currency: globalCurrency,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        frequency: 'onetime',
      },
    ]);
  };

  // Load portfolio positions for simulation
  const loadPortfolioForSimulation = async () => {
    const { positions } = usePortfolioStore.getState();

    if (positions.length === 0) {
      alert('No positions in portfolio. Please add positions first.');
      router.push('/portfolio');
      return;
    }

    setPortfolioMode(true);

    // Transform to simulation params
    const simParams: SimulationParams[] = positions.map(p => {
      const addedDate = new Date(p.addedAt);
      const daysSinceAdded = Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
      const startDate = daysSinceAdded > 0
        ? addedDate.toISOString().split('T')[0]
        : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return {
        symbol: p.symbol,
        name: p.name,
        type: p.type,
        investmentAmount: p.quantity * p.averageBuyPrice,
        currency: p.currency,
        startDate,
        endDate: new Date().toISOString().split('T')[0],
        frequency: 'onetime' as const
      };
    });

    setParams(simParams);
  };

  // Remove simulation parameter
  const removeSimulation = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    setParams(newParams);
    if (newParams.length < 2) {
      setCompareMode(false);
    }
  };

  // Update simulation parameter
  const updateParam = (index: number, field: keyof SimulationParams, value: any) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  // Run simulation
  const runSimulation = async () => {
    setLoading(true);
    try {
      const simulationResults: SimulationResult[] = [];

      for (const param of params) {
        if (!param.symbol) continue;

        // Fetch historical data
        const endDate = new Date(param.endDate);
        const startDate = new Date(param.startDate);
        const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const endpoint = param.type === 'GOLD' || param.type === 'SILVER'
          ? `/api/${param.type.toLowerCase()}/history?days=${daysDiff}`
          : `/api/stocks/history?symbol=${param.symbol}&days=${daysDiff}`;

        const response = await fetch(endpoint);
        const result = await response.json();

        if (result.success && result.data) {
          const historicalData = result.data.historicalData || [];
          const currentPrice = result.data.currentPrice || historicalData[historicalData.length - 1]?.price || 0;

          // Calculate investment performance
          let totalInvested = 0;
          let totalUnits = 0;
          const performanceData: Array<{ date: string; price: number; value: number }> = [];

          if (param.frequency === 'onetime') {
            // One-time investment
            const startPrice = historicalData[0]?.price || currentPrice;
            totalUnits = param.investmentAmount / startPrice;
            totalInvested = param.investmentAmount;

            // Calculate performance over time
            for (const data of historicalData) {
              performanceData.push({
                date: data.date,
                price: data.price,
                value: totalUnits * data.price,
              });
            }
          } else {
            // DCA (Dollar Cost Averaging)
            let intervalDays: number;
            let numInvestments: number;

            if (param.frequency === 'monthly') {
              // Calculate actual number of months between dates
              const startYear = startDate.getFullYear();
              const startMonth = startDate.getMonth();
              const endYear = endDate.getFullYear();
              const endMonth = endDate.getMonth();

              numInvestments = (endYear - startYear) * 12 + (endMonth - startMonth);
              intervalDays = Math.floor(daysDiff / Math.max(1, numInvestments));
            } else {
              // Weekly
              intervalDays = 7;
              numInvestments = Math.floor(daysDiff / intervalDays);
            }

            const investmentPerPeriod = param.investmentAmount / Math.max(1, numInvestments);

            for (let i = 0; i < numInvestments; i++) {
              const dayIndex = Math.min(i * intervalDays, historicalData.length - 1);
              const price = historicalData[dayIndex]?.price || currentPrice;
              totalUnits += investmentPerPeriod / price;
              totalInvested += investmentPerPeriod;
            }

            // Calculate performance over time
            let accumulatedUnits = 0;
            let accumulatedInvestment = 0;

            for (let i = 0; i < historicalData.length; i += intervalDays) {
              const price = historicalData[i]?.price || currentPrice;
              accumulatedUnits += investmentPerPeriod / price;
              accumulatedInvestment += investmentPerPeriod;

              performanceData.push({
                date: historicalData[i].date,
                price: price,
                value: accumulatedUnits * price,
              });
            }
          }

          const currentValue = totalUnits * currentPrice;
          const profitLoss = currentValue - totalInvested;
          const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
          const avgPricePerUnit = totalUnits > 0 ? totalInvested / totalUnits : 0;

          simulationResults.push({
            symbol: param.symbol,
            name: param.name || param.symbol,
            type: param.type,
            initialInvestment: totalInvested,
            currentValue,
            profitLoss,
            profitLossPercent,
            totalUnits,
            avgPricePerUnit,
            currentPrice,
            currency: param.currency,
            historicalData: performanceData,
          });
        }
      }

      setResults(simulationResults);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add one default simulation on mount (only if params is empty)
    if (params.length === 0) {
      addSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Check for portfolio mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('portfolio') === 'true') {
      loadPortfolioForSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              Investment Simulation
            </h1>
            {portfolioMode && (
              <Badge variant="secondary" className="gap-1">
                <Wallet className="h-3 w-3" />
                Portfolio Mode ({params.length} positions)
              </Badge>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {portfolioMode
              ? 'Simulating your actual portfolio performance'
              : 'Simulate past investments and forecast future performance'}
          </p>
        </div>
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="setup">Setup Simulation</TabsTrigger>
            <TabsTrigger value="results" disabled={results.length === 0}>
              View Results {results.length > 0 && `(${results.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {/* Simulation Parameters */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Investment Parameters</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {portfolioMode
                      ? 'Your portfolio positions are loaded below'
                      : 'Configure your investment simulation scenarios'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!portfolioMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const { positions } = usePortfolioStore.getState();
                        if (positions.length === 0) {
                          alert('No positions in portfolio. Add positions first.');
                          return;
                        }
                        loadPortfolioForSimulation();
                      }}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Load My Portfolio
                    </Button>
                  )}
                  {params.length > 1 && (
                    <Button
                      variant={compareMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCompareMode(!compareMode)}
                    >
                      Compare Mode: {compareMode ? 'ON' : 'OFF'}
                    </Button>
                  )}
                  <Button onClick={addSimulation} size="sm">
                    + Add Scenario
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {params.map((param, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Scenario {index + 1}</h3>
                      {params.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSimulation(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Symbol */}
                      <div className="space-y-2">
                        <Label>Symbol</Label>
                        <Input
                          placeholder="e.g., GOLD, BBCA.JK"
                          value={param.symbol}
                          onChange={(e) => updateParam(index, 'symbol', e.target.value)}
                        />
                      </div>

                      {/* Investment Type */}
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={param.type}
                          onChange={(e) => updateParam(index, 'type', e.target.value)}
                        >
                          <option value="STOCK">Stock</option>
                          <option value="GOLD">Gold</option>
                          <option value="SILVER">Silver</option>
                          <option value="CRYPTO">Crypto</option>
                        </select>
                      </div>

                      {/* Currency */}
                      <div className="space-y-2">
                        <CurrencySelector
                          label="Currency"
                          value={param.currency}
                          onChange={(currency) => updateParam(index, 'currency', currency)}
                        />
                      </div>

                      {/* Investment Amount */}
                      <div className="space-y-2">
                        <Label>Investment Amount</Label>
                        <Input
                          type="number"
                          value={param.investmentAmount}
                          onChange={(e) => updateParam(index, 'investmentAmount', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={param.startDate}
                          onChange={(e) => updateParam(index, 'startDate', e.target.value)}
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={param.endDate}
                          onChange={(e) => updateParam(index, 'endDate', e.target.value)}
                        />
                      </div>

                      {/* Investment Frequency */}
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label>Investment Strategy</Label>
                        <div className="flex gap-4">
                          {(['onetime', 'monthly', 'weekly'] as const).map((freq) => (
                            <label key={freq} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`frequency-${index}`}
                                value={freq}
                                checked={param.frequency === freq}
                                onChange={() => updateParam(index, 'frequency', freq)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm capitalize">{freq === 'onetime' ? 'One-time Investment' : freq + ' Investment (DCA)'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={runSimulation}
                  disabled={loading || params.length === 0 || params.some(p => !p.symbol)}
                  size="lg"
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Quick Templates */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Quick Templates</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => {
                    setParams([{
                      symbol: 'GOLD',
                      name: 'Gold',
                      type: 'GOLD',
                      investmentAmount: 10000,
                      currency: 'USD',
                      startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      frequency: 'onetime',
                    }]);
                  }}
                >
                  <span className="font-semibold">$10k in Gold 5 Years Ago</span>
                  <span className="text-xs text-slate-500">One-time investment simulation</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => {
                    setParams([{
                      symbol: 'BBCA.JK',
                      name: 'Bank Central Asia',
                      type: 'STOCK',
                      investmentAmount: 10000000,
                      currency: 'IDR',
                      startDate: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      frequency: 'monthly',
                    }]);
                  }}
                >
                  <span className="font-semibold">Monthly BBCA.JK Investment</span>
                  <span className="text-xs text-slate-500">DCA strategy for 3 years</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => {
                    setParams([
                      {
                        symbol: 'GOLD',
                        name: 'Gold',
                        type: 'GOLD',
                        investmentAmount: 10000,
                        currency: 'USD',
                        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        frequency: 'onetime',
                      },
                      {
                        symbol: 'BBCA.JK',
                        name: 'Bank Central Asia',
                        type: 'STOCK',
                        investmentAmount: 10000,
                        currency: 'USD',
                        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        frequency: 'onetime',
                      },
                    ]);
                    setCompareMode(true);
                  }}
                >
                  <span className="font-semibold">Gold vs Stock Comparison</span>
                  <span className="text-xs text-slate-500">Side-by-side performance</span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Forecast Section for Portfolio Mode */}
            {portfolioMode && results.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold mb-2">Future Value Forecast</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Projected portfolio value based on historical performance trends
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { value: 30, label: '30 Days' },
                    { value: 90, label: '90 Days' },
                    { value: 180, label: '180 Days' },
                    { value: 365, label: '1 Year' },
                    { value: 730, label: '2 Years' },
                    { value: 1095, label: '3 Years' },
                    { value: 1460, label: '4 Years' },
                    { value: 1825, label: '5 Years' },
                    { value: 3650, label: '10 Years' },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={forecastHorizon === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForecastHorizon(value as typeof forecastHorizon)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <PortfolioForecastResults results={results} horizon={forecastHorizon} />
              </Card>
            )}

            {compareMode && results.length > 1 ? (
              <SimulationComparison results={results} />
            ) : (
              <SimulationResults results={results} onReset={() => setResults([])} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
