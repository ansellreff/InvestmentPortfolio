import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Dividend {
  id: string;
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  amount: number;
  currency: string;
  exDate: string;
  paymentDate?: string;
  shares: number;
  perShare: number;
  notes?: string;
  createdAt: string;
}

export interface DividendSummary {
  year: number;
  totalAmount: number;
  bySymbol: Record<string, number>;
  portfolioValue: number;
  annualYield: number;
  monthlyBreakdown: Array<{ month: number; monthName: string; amount: number }>;
  projectedAnnual: number;
  dividendCount: number;
}

interface DividendStore {
  dividends: Dividend[];
  summary: DividendSummary | null;
  loading: boolean;
  error: string | null;

  // Actions
  addDividend: (dividend: Omit<Dividend, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteDividend: (id: string) => Promise<boolean>;
  loadDividends: () => Promise<void>;
  loadSummary: (year?: number) => Promise<void>;
  clearError: () => void;
}

export const useDividendStore = create<DividendStore>()(
  persist(
    (set, get) => ({
      dividends: [],
      summary: null,
      loading: false,
      error: null,

      addDividend: async (dividend) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/dividends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dividend),
          });

          const result = await response.json();

          if (result.success) {
            // Reload dividends
            await get().loadDividends();
            set({ loading: false });
            return true;
          }

          set({ loading: false, error: result.error || 'Failed to add dividend' });
          return false;
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to add dividend'
          });
          return false;
        }
      },

      deleteDividend: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/dividends?id=${id}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              dividends: state.dividends.filter((d) => d.id !== id),
              loading: false,
            }));
            return true;
          }

          set({ loading: false, error: result.error || 'Failed to delete dividend' });
          return false;
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to delete dividend'
          });
          return false;
        }
      },

      loadDividends: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/dividends');
          const result = await response.json();

          if (result.success) {
            set({ dividends: result.data, loading: false });
          } else {
            set({ loading: false, error: result.error || 'Failed to load dividends' });
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load dividends'
          });
        }
      },

      loadSummary: async (year) => {
        set({ loading: true, error: null });
        try {
          const url = year ? `/api/dividends/summary?year=${year}` : '/api/dividends/summary';
          const response = await fetch(url);
          const result = await response.json();

          if (result.success) {
            set({ summary: result.data, loading: false });
          } else {
            set({ loading: false, error: result.error || 'Failed to load summary' });
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load summary'
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'investment-advisor-dividend-storage',
      partialize: (state) => ({
        dividends: state.dividends,
      }),
    }
  )
);
