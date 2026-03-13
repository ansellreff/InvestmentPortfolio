import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  addedAt: string;
}

interface WatchlistStore {
  items: WatchlistItem[];
  addItem: (item: WatchlistItem) => void;
  removeItem: (symbol: string) => void;
  clearItems: () => void;
  isInWatchlist: (symbol: string) => boolean;
}

export const useWatchlist = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Check if already in watchlist
          const exists = state.items.some((i) => i.symbol === item.symbol);
          if (exists) {
            return state;
          }
          return {
            items: [...state.items, { ...item, addedAt: new Date().toISOString() }],
          };
        }),
      removeItem: (symbol) =>
        set((state) => ({
          items: state.items.filter((i) => i.symbol !== symbol),
        })),
      clearItems: () => set({ items: [] }),
      isInWatchlist: (symbol) => {
        return get().items.some((i) => i.symbol === symbol);
      },
    }),
    {
      name: 'investment-advisor-watchlist',
    }
  )
);
