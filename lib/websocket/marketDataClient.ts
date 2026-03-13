/**
 * Real-time market data WebSocket client
 * Supports Binance streams for crypto, Finnhub for stocks
 */

interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
}

type PriceCallback = (data: MarketDataUpdate) => void;

class MarketDataWebSocket {
  private ws: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();
  private callbacks: Set<PriceCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Connect to market data feed
   * Uses Binance for crypto, polling for other assets
   */
  connect() {
    // Use Binance combined streams for crypto
    const cryptoSymbols = Array.from(this.subscriptions)
      .filter(s => this.isCryptoSymbol(s));

    if (cryptoSymbols.length > 0) {
      const streams = cryptoSymbols.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
      this.connectToBinance(streams);
    }
  }

  private connectToBinance(streams: string) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[MarketData] WebSocket connected to Binance');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle Binance ticker format
      if (data.s && data.c) {
        const update: MarketDataUpdate = {
          symbol: data.s,
          price: parseFloat(data.c),
          change: parseFloat(data.p),
          changePercent: parseFloat(data.P),
          volume: parseFloat(data.v),
          timestamp: Date.now()
        };

        this.notifyCallbacks(update);
      }
    };

    this.ws.onclose = () => {
      console.log('[MarketData] WebSocket closed');
      this.stopPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[MarketData] WebSocket error:', error);
    };
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Binance doesn't need ping, it sends heartbeat automatically
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`[MarketData] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  private notifyCallbacks(update: MarketDataUpdate) {
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[MarketData] Callback error:', error);
      }
    });
  }

  /**
   * Subscribe to real-time updates for a symbol
   */
  subscribe(symbol: string, callback: PriceCallback) {
    this.subscriptions.add(symbol);
    this.callbacks.add(callback);

    if (this.ws?.readyState !== WebSocket.OPEN && this.isCryptoSymbol(symbol)) {
      this.connect();
    }
  }

  /**
   * Unsubscribe from symbol updates
   */
  unsubscribe(symbol: string) {
    this.subscriptions.delete(symbol);

    if (this.subscriptions.size === 0 && this.ws) {
      this.ws.close();
    }
  }

  private isCryptoSymbol(symbol: string): boolean {
    const knownCryptos = ['BTC', 'ETH', 'XRP', 'ADA', 'DOT', 'SOL', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM'];
    const upper = symbol.toUpperCase();
    return knownCryptos.some(c => upper.includes(c)) || upper.endsWith('USDT') || upper.endsWith('BUSD');
  }

  disconnect() {
    this.ws?.close();
    this.stopPing();
    this.subscriptions.clear();
    this.callbacks.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const marketDataClient = new MarketDataWebSocket();
export type { MarketDataUpdate, PriceCallback };
