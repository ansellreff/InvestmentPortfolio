import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Instrument {
  symbol: string;
  name?: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  price?: number;
  currency?: string;
}

interface ComparisonStore {
  selectedInstruments: Instrument[];
  addInstrument: (instrument: Instrument) => void;
  removeInstrument: (symbol: string) => void;
  clearInstruments: () => void;
  updateInstrumentPrice: (symbol: string, price: number, currency: string) => void;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set) => ({
      selectedInstruments: [],
      addInstrument: (instrument) =>
        set((state) => {
          // Check if instrument already exists
          const exists = state.selectedInstruments.some(
            (i) => i.symbol === instrument.symbol
          );
          if (exists) {
            return state;
          }
          return {
            selectedInstruments: [...state.selectedInstruments, instrument],
          };
        }),
      removeInstrument: (symbol) =>
        set((state) => ({
          selectedInstruments: state.selectedInstruments.filter(
            (i) => i.symbol !== symbol
          ),
        })),
      clearInstruments: () => set({ selectedInstruments: [] }),
      updateInstrumentPrice: (symbol, price, currency) =>
        set((state) => ({
          selectedInstruments: state.selectedInstruments.map((i) =>
            i.symbol === symbol ? { ...i, price, currency } : i
          ),
        })),
    }),
    {
      name: 'investment-advisor-storage',
    }
  )
);
