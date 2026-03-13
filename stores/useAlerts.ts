import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  currency: string;
  triggered: boolean;
  createdAt: string;
}

interface AlertStore {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  markTriggered: (id: string) => void;
  getAlertsForSymbol: (symbol: string) => PriceAlert[];
}

export const useAlerts = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            ...state.alerts,
            {
              ...alert,
              id: `${alert.symbol}-${alert.targetPrice}-${Date.now()}`,
              createdAt: new Date().toISOString(),
              triggered: false,
            },
          ],
        })),
      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),
      clearAlerts: () => set({ alerts: [] }),
      markTriggered: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, triggered: true } : a
          ),
        })),
      getAlertsForSymbol: (symbol) => {
        return get().alerts.filter((a) => a.symbol === symbol && !a.triggered);
      },
    }),
    {
      name: 'investment-advisor-alerts',
    }
  )
);
