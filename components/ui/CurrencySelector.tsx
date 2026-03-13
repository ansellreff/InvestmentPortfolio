'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, DollarSign } from 'lucide-react';
import { POPULAR_CURRENCIES, getCurrencySymbol } from '@/lib/utils/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  placeholder?: string;
}

export function CurrencySelector({ value, onChange, label, placeholder = 'Select currency' }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customCurrency, setCustomCurrency] = useState('');

  const selectedCurrency = POPULAR_CURRENCIES.find(c => c.code === value);

  const handleSelect = (code: string) => {
    onChange(code.toUpperCase());
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customCurrency.trim()) {
      onChange(customCurrency.trim().toUpperCase());
      setIsOpen(false);
      setCustomCurrency('');
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <span className="text-lg">{getCurrencySymbol(value)}</span>
                <span className="font-medium">{value.toUpperCase()}</span>
                {selectedCurrency && (
                  <span className="text-xs text-slate-500">({selectedCurrency.name})</span>
                )}
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {/* Popular Currencies */}
            <div className="p-2">
              <p className="text-xs text-slate-500 px-2 py-1 font-medium">Popular Currencies</p>
              <div className="space-y-1">
                {POPULAR_CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSelect(currency.code)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currency.symbol}</span>
                      <span className="font-medium">{currency.code}</span>
                    </div>
                    {value === currency.code && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Currency */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-2">
              <p className="text-xs text-slate-500 px-2 py-1 font-medium">Custom Currency (3-letter code)</p>
              <div className="flex gap-2 p-2">
                <Input
                  placeholder="e.g., EUR, GBP, JPY"
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={!customCurrency || customCurrency.length !== 3}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
