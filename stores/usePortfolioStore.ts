import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchPortfolio,
  addPortfolioPosition,
  updatePortfolioPosition,
  deletePortfolioPosition,
  mergePortfolios,
  fromApiPosition,
  type Position as ServicePosition,
} from '@/lib/api/portfolioService';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  quantity: number;
  averageBuyPrice: number;
  currency: string;
  addedAt: string;
  notes?: string;
}

interface PositionWithValue extends Position {
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  profitLossToday?: number;
}

type SyncState = 'idle' | 'syncing' | 'error' | 'success';

interface PortfolioStore {
  // State
  positions: Position[];
  syncState: SyncState;
  lastSyncTime: string | null;
  syncError: string | null;

  // Local-only actions (for optimistic updates)
  addPosition: (position: Omit<Position, 'id' | 'addedAt'>) => void;
  updatePosition: (id: string, updates: Partial<Omit<Position, 'id'>>) => void;
  removePosition: (id: string) => void;
  clearPositions: () => void;
  getPositionById: (id: string) => Position | undefined;

  // Database sync actions
  initializePortfolio: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  addPositionWithSync: (position: Omit<Position, 'id' | 'addedAt'>) => Promise<boolean>;
  updatePositionWithSync: (symbol: string, updates: Partial<Omit<Position, 'id' | 'symbol'>>) => Promise<boolean>;
  removePositionWithSync: (symbol: string) => Promise<boolean>;

  // Computed values
  getTotalValue: (prices: Record<string, number>) => number;
  getTotalCostBasis: () => number;
  getTotalProfitLoss: (prices: Record<string, number>) => { profitLoss: number; profitLossPercent: number };
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      positions: [],
      syncState: 'idle',
      lastSyncTime: null,
      syncError: null,

      // Local-only actions (optimistic updates)
      addPosition: (position) => {
        const id = `${position.symbol}-${Date.now()}`;
        const newPosition: Position = {
          ...position,
          id,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          positions: [...state.positions, newPosition],
        }));
      },

      updatePosition: (id, updates) => {
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      removePosition: (id) => {
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== id),
        }));
      },

      clearPositions: () => {
        set({ positions: [] });
      },

      getPositionById: (id) => {
        return get().positions.find((p) => p.id === id);
      },

      // Initialize portfolio from database
      initializePortfolio: async () => {
        set({ syncState: 'syncing', syncError: null });

        try {
          const remotePositions = await fetchPortfolio();
          const localPositions = get().positions;

          // Merge remote and local positions (remote takes precedence)
          const mergedPositions = mergePortfolios(localPositions, remotePositions);

          set({
            positions: mergedPositions,
            syncState: 'success',
            lastSyncTime: new Date().toISOString(),
          });
        } catch (error) {
          set({
            syncState: 'error',
            syncError: error instanceof Error ? error.message : 'Failed to load portfolio',
          });
        }
      },

      // Sync all local positions to database
      syncToDatabase: async () => {
        const localPositions = get().positions;
        set({ syncState: 'syncing', syncError: null });

        try {
          // Fetch current remote positions
          const remotePositions = await fetchPortfolio();
          const remoteSymbols = new Set(remotePositions.map(p => p.symbol));

          // Add or update each local position
          for (const position of localPositions) {
            if (remoteSymbols.has(position.symbol)) {
              // Update existing
              await updatePortfolioPosition(position.symbol, position);
            } else {
              // Add new
              await addPortfolioPosition(position);
            }
          }

          set({
            syncState: 'success',
            lastSyncTime: new Date().toISOString(),
          });
        } catch (error) {
          set({
            syncState: 'error',
            syncError: error instanceof Error ? error.message : 'Failed to sync portfolio',
          });
        }
      },

      // Add position with database sync
      addPositionWithSync: async (position) => {
        // Optimistic update
        const id = `${position.symbol}-${Date.now()}`;
        const newPosition: Position = {
          ...position,
          id,
          addedAt: new Date().toISOString(),
        };

        set((state) => ({
          positions: [...state.positions, newPosition],
          syncState: 'syncing',
        }));

        try {
          const result = await addPortfolioPosition(position);

          if (result) {
            // Update with server ID
            set((state) => ({
              positions: state.positions.map((p) =>
                p.id === id ? { ...p, id: result.id } : p
              ),
              syncState: 'success',
              lastSyncTime: new Date().toISOString(),
            }));
            return true;
          }

          return false;
        } catch (error) {
          // Rollback on error
          set((state) => ({
            positions: state.positions.filter((p) => p.id !== id),
            syncState: 'error',
            syncError: error instanceof Error ? error.message : 'Failed to add position',
          }));
          return false;
        }
      },

      // Update position with database sync
      updatePositionWithSync: async (symbol, updates) => {
        const previousPositions = get().positions;

        // Optimistic update
        set((state) => ({
          positions: state.positions.map((p) =>
            p.symbol === symbol ? { ...p, ...updates } : p
          ),
          syncState: 'syncing',
        }));

        try {
          const result = await updatePortfolioPosition(symbol, updates);

          if (result) {
            set({
              syncState: 'success',
              lastSyncTime: new Date().toISOString(),
            });
            return true;
          }

          // Rollback
          set({ positions: previousPositions });
          return false;
        } catch (error) {
          // Rollback on error
          set({
            positions: previousPositions,
            syncState: 'error',
            syncError: error instanceof Error ? error.message : 'Failed to update position',
          });
          return false;
        }
      },

      // Remove position with database sync
      removePositionWithSync: async (symbol) => {
        const previousPositions = get().positions;
        const positionToRemove = previousPositions.find(p => p.symbol === symbol);

        if (!positionToRemove) {
          return false;
        }

        // Optimistic update
        set((state) => ({
          positions: state.positions.filter((p) => p.symbol !== symbol),
          syncState: 'syncing',
        }));

        try {
          const success = await deletePortfolioPosition(symbol);

          if (success) {
            set({
              syncState: 'success',
              lastSyncTime: new Date().toISOString(),
            });
            return true;
          }

          // Rollback
          set({ positions: previousPositions });
          return false;
        } catch (error) {
          // Rollback on error
          set({
            positions: previousPositions,
            syncState: 'error',
            syncError: error instanceof Error ? error.message : 'Failed to delete position',
          });
          return false;
        }
      },

      getTotalValue: (prices) => {
        const positions = get().positions;
        let totalValue = 0;

        for (const position of positions) {
          const currentPrice = prices[position.symbol];
          if (currentPrice) {
            totalValue += currentPrice * position.quantity;
          }
        }

        return totalValue;
      },

      getTotalCostBasis: () => {
        const positions = get().positions;
        return positions.reduce(
          (total, position) => total + position.averageBuyPrice * position.quantity,
          0
        );
      },

      getTotalProfitLoss: (prices) => {
        const positions = get().positions;
        let totalValue = 0;
        let totalCost = 0;

        for (const position of positions) {
          const currentPrice = prices[position.symbol];
          if (currentPrice) {
            totalValue += currentPrice * position.quantity;
          }
          totalCost += position.averageBuyPrice * position.quantity;
        }

        const profitLoss = totalValue - totalCost;
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        return { profitLoss, profitLossPercent };
      },
    }),
    {
      name: 'investment-advisor-portfolio-storage',
    }
  )
);
