'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { useCurrencyStore } from '@/stores/useCurrencyStore';
import { POPULAR_CURRENCIES, ALL_CURRENCIES } from '@/lib/utils/currency';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Input } from './input';

export function HeaderCurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [customCurrency, setCustomCurrency] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currency, setCurrency } = useCurrencyStore();

  // Filter currencies based on input
  const filteredCurrencies = ALL_CURRENCIES.filter((c) => {
    const search = customCurrency.toLowerCase();
    return (
      c.code.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search)
    );
  });

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
    setCustomCurrency('');
    setShowSuggestions(false);
  };

  const handleCustomSubmit = () => {
    if (customCurrency.trim()) {
      setCurrency(customCurrency.trim().toUpperCase());
      setIsOpen(false);
      setCustomCurrency('');
      setShowSuggestions(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 min-w-[100px] justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base">{getCurrencySymbol(currency)}</span>
        <span className="font-semibold">{currency}</span>
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden flex flex-col">
          <div className="p-3 space-y-3 overflow-y-auto">
            {/* Popular Currencies */}
            <div>
              <p className="text-xs text-slate-500 mb-2 px-2 font-medium">Popular Currencies</p>
              <div className="space-y-1">
                {POPULAR_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSelect(c.code)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.symbol}</span>
                      <div className="text-left">
                        <span className="font-medium text-sm block">{c.code}</span>
                        <span className="text-xs text-slate-500">{c.name}</span>
                      </div>
                    </div>
                    {currency === c.code && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Currency with Autocomplete */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <p className="text-xs text-slate-500 mb-2 px-2 font-medium">
                {customCurrency ? 'Search Results' : 'All Currencies'}
              </p>

              {/* Search Input */}
              <div className="relative p-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={inputRef}
                  placeholder="Type to search currencies..."
                  value={customCurrency}
                  onChange={(e) => {
                    setCustomCurrency(e.target.value.toUpperCase());
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(customCurrency.length > 0)}
                  className="pl-10 h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Select first filtered currency if available
                      if (filteredCurrencies.length > 0) {
                        handleSelect(filteredCurrencies[0].code);
                      } else {
                        handleCustomSubmit();
                      }
                    }
                  }}
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && customCurrency.length > 0 && (
                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-md max-h-48 overflow-y-auto">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.slice(0, 8).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                        onClick={() => handleSelect(c.code)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.symbol}</span>
                          <div>
                            <span className="font-medium text-sm">{c.code}</span>
                            <span className="text-xs text-slate-500 ml-2">{c.name}</span>
                          </div>
                        </div>
                        {currency === c.code && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      No currencies found. Press Enter to use "{customCurrency}".
                    </div>
                  )}
                </div>
              )}

              {/* All Currencies List (shown when not searching) */}
              {!showSuggestions && (
                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-md max-h-48 overflow-y-auto">
                  {ALL_CURRENCIES.slice(4).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                      onClick={() => handleSelect(c.code)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.symbol}</span>
                        <div>
                          <span className="font-medium text-sm">{c.code}</span>
                          <span className="text-xs text-slate-500 ml-2">{c.name}</span>
                        </div>
                      </div>
                      {currency === c.code && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Tip */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 px-2">
              💡 Type to search or select from the list
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
