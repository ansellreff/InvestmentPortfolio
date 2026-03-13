import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeCurrencyCode } from '@/lib/utils/currency';

interface CurrencyState {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'USD',
      setCurrency: (currency) => set({ currency: normalizeCurrencyCode(currency) }),
    }),
    {
      name: 'currency-storage',
    }
  )
);
