import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ChartType = 'line' | 'candlestick' | 'area';
type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
type Theme = 'light' | 'dark' | 'system';

interface PreferencesStore {
  theme: Theme;
  defaultChartType: ChartType;
  defaultTimeframe: Timeframe;
  showVolume: boolean;
  showIndicators: boolean;
  currency: 'USD' | 'IDR' | 'auto';
  setTheme: (theme: Theme) => void;
  setDefaultChartType: (type: ChartType) => void;
  setDefaultTimeframe: (timeframe: Timeframe) => void;
  setShowVolume: (show: boolean) => void;
  setShowIndicators: (show: boolean) => void;
  setCurrency: (currency: 'USD' | 'IDR' | 'auto') => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      theme: 'system',
      defaultChartType: 'candlestick',
      defaultTimeframe: '1M',
      showVolume: true,
      showIndicators: true,
      currency: 'auto',
      setTheme: (theme) => set({ theme }),
      setDefaultChartType: (defaultChartType) => set({ defaultChartType }),
      setDefaultTimeframe: (defaultTimeframe) => set({ defaultTimeframe }),
      setShowVolume: (showVolume) => set({ showVolume }),
      setShowIndicators: (showIndicators) => set({ showIndicators }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'investment-advisor-preferences',
    }
  )
);
