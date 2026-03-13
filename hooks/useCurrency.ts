/**
 * Custom hook for currency conversion with real-time rates
 */

import { useCurrencyStore } from '@/stores/useCurrencyStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  convertCurrencySync,
  fetchExchangeRates,
  areRatesStale,
  normalizeCurrencyCode,
} from '@/lib/utils/currencyConversion';

export function useCurrency() {
  const { currency: targetCurrency } = useCurrencyStore();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const isMounted = useRef(true);

  // Load exchange rates on mount
  const loadRates = useCallback(async () => {
    if (!isMounted.current) return;

    setIsLoading(true);
    try {
      const exchangeRates = await fetchExchangeRates();
      if (isMounted.current) {
        setRates(exchangeRates);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('[Currency] Failed to load exchange rates:', error);
      // Ensure USD is always available with rate 1
      if (isMounted.current) {
        setRates({ USD: 1 });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Refresh rates every 5 minutes for accuracy
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isMounted.current) return;

      try {
        const newRates = await fetchExchangeRates();
        if (isMounted.current) {
          setRates(newRates);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.warn('[Currency] Failed to refresh exchange rates:', error);
      }
    }, 300000); // 5 minutes - more frequent updates for accuracy

    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, []);

  /**
   * Convert price from original currency to target currency
   */
  const convertPrice = useCallback((
    price: number,
    fromCurrency: string
  ): { price: number; currency: string; originalPrice: number; originalCurrency: string } => {
    // Normalize currency codes (NTD -> TWD)
    const normalizedFrom = normalizeCurrencyCode(fromCurrency);
    const normalizedTarget = normalizeCurrencyCode(targetCurrency);

    // Handle null/undefined/invalid prices
    if (price === null || price === undefined || !isFinite(price)) {
      return {
        price: 0,
        currency: normalizedTarget,
        originalPrice: 0,
        originalCurrency: normalizedFrom || normalizedTarget,
      };
    }

    // If same currency, no conversion needed
    if (normalizedFrom === normalizedTarget) {
      return {
        price,
        currency: normalizedTarget,
        originalPrice: price,
        originalCurrency: normalizedFrom,
      };
    }

    // Check if we have rates, if not or stale, try to fetch
    if (Object.keys(rates).length <= 1 || areRatesStale()) {
      console.warn('[Currency] Rates missing or stale, using cached/sync conversion');
    }

    const convertedPrice = convertCurrencySync(price, normalizedFrom, normalizedTarget);

    return {
      price: convertedPrice,
      currency: normalizedTarget,
      originalPrice: price,
      originalCurrency: normalizedFrom,
    };
  }, [targetCurrency, rates]);

  /**
   * Format price in target currency (converts from fromCurrency to targetCurrency)
   */
  const formatPrice = useCallback((
    price: number,
    fromCurrency: string,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string => {
    const { price: convertedPrice, currency: normalizedCurrency } = convertPrice(price, fromCurrency);

    // Handle invalid prices
    if (!convertedPrice || !isFinite(convertedPrice)) {
      return `${normalizedCurrency} 0.00`;
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      }).format(convertedPrice);
    } catch (error) {
      // Fallback if currency code is invalid for Intl
      return `${normalizedCurrency} ${convertedPrice.toFixed(2)}`;
    }
  }, [convertPrice]);

  /**
   * Format price that is already in target currency (no conversion)
   * Use this for values that have already been converted to targetCurrency
   */
  const formatPriceRaw = useCallback((
    price: number,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string => {
    // Handle invalid prices
    if (!price || !isFinite(price)) {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: targetCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(0);
      } catch {
        return `${targetCurrency} 0.00`;
      }
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      }).format(price);
    } catch (error) {
      // Fallback if currency code is invalid for Intl
      return `${targetCurrency} ${price.toFixed(2)}`;
    }
  }, [targetCurrency]);

  /**
   * Manually refresh rates
   */
  const refreshRates = useCallback(async () => {
    await loadRates();
  }, [loadRates]);

  return {
    targetCurrency,
    convertPrice,
    formatPrice,
    formatPriceRaw,
    rates,
    isLoading,
    lastUpdate,
    refreshRates,
  };
}
