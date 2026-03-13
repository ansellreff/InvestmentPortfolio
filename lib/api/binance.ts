import crypto from 'crypto';

// Helper function to create timeout signal (works in all Node versions)
function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Binance API base URLs
export const BINANCE_API_URL = 'https://api.binance.com/api';
export const BINANCE_TESTNET_URL = 'https://testnet.binance.vision/api';

/**
 * Detailed error information from Binance API
 */
interface BinanceError {
  code: number;
  msg: string;
}

/**
 * Binance API Client for read-only operations
 * This client only uses endpoints that read data and does not perform any trading or withdrawal operations
 */
export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeOffset: number = 0;

  constructor(apiKey: string, apiSecret: string, testnet = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testnet ? BINANCE_TESTNET_URL : BINANCE_API_URL;
  }

  /**
   * Get Binance server time and calculate offset
   * This is required to avoid "Timestamp for this request is outside of the recvWindow" errors
   */
  private async syncTime(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/time`, {
        // Add timeout to prevent hanging
        signal: createTimeoutSignal(10000),
      });

      if (!response.ok) {
        throw new Error(`Server time request failed: ${response.status}`);
      }

      const data = await response.json();
      const serverTime = data.serverTime;
      const localTime = Date.now();
      this.timeOffset = serverTime - localTime;
      return serverTime;
    } catch (error) {
      console.error('[Binance] Failed to sync time:', error);
      throw new Error('Cannot connect to Binance server. Please check your internet connection.');
    }
  }

  /**
   * Get synchronized timestamp
   */
  private getTimestamp(): number {
    return Date.now() + this.timeOffset;
  }

  /**
   * Generate signature for signed endpoints
   */
  private signature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Parse Binance API error response
   */
  private parseBinanceError(data: any): string {
    // Binance returns error in format: { code: -2014, msg: "error message" }
    if (data.code && data.msg) {
      console.error('[Binance] API Error:', { code: data.code, msg: data.msg });
      return data.msg;
    }
    return data.msg || data.message || 'Unknown error';
  }

  /**
   * Make a signed request to Binance API
   */
  private async signedRequest(endpoint: string, extraParams: Record<string, string> = {}): Promise<any> {
    // Sync time before making signed request
    if (this.timeOffset === 0) {
      await this.syncTime();
    }

    const timestamp = this.getTimestamp();
    const params = new URLSearchParams({
      ...extraParams,
      timestamp: timestamp.toString(),
    });

    const queryString = params.toString();
    const signature = this.signature(queryString);

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    console.log('[Binance] Request URL:', endpoint);
    console.log('[Binance] API Key (first 8 chars):', this.apiKey.substring(0, 8) + '...');

    try {
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
        signal: createTimeoutSignal(30000), // 30 second timeout
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = this.parseBinanceError(data);

        // Handle specific Binance error codes
        if (data.code === -1021) {
          // Timestamp error - retry with fresh time sync
          console.log('[Binance] Timestamp error, retrying...');
          this.timeOffset = 0;
          await this.syncTime();
          return this.signedRequest(endpoint, extraParams);
        }

        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      // Re-throw with context
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Get account information
   * Uses multiple fallback endpoints that require different permission levels
   */
  async getAccount(): Promise<any> {
    // Try the simplest endpoint first - /sapi/v1/account/status (only needs "Enable Reading")
    try {
      console.log('[Binance] Trying /sapi/v1/account/status (minimal permissions)...');
      return await this.signedRequest('/sapi/v1/account/status');
    } catch (statusError) {
      console.log('[Binance] Status endpoint failed, trying /sapi/v1/accountSnapshot...');
      // Try snapshot endpoint (works with "Enable Reading" permission)
      try {
        return await this.signedRequest('/sapi/v1/accountSnapshot');
      } catch (snapshotError) {
        console.log('[Binance] Snapshot failed, trying /v3/account (requires "Enable Spot & Margin Trading")...');
        // Final fallback to /v3/account (requires Spot & Margin permission)
        return await this.signedRequest('/v3/account');
      }
    }
  }

  /**
   * Get current balances (non-zero balances only)
   * Uses fallback endpoints to work with minimal permissions
   */
  async getBalances(): Promise<Array<{
    asset: string;
    free: string;
    locked: string;
  }>> {
    // Try using the account snapshot endpoint first (works with "Enable Reading" permission)
    try {
      console.log('[Binance] Trying /sapi/v1/accountSnapshot for balances...');
      const snapshot = await this.signedRequest('/sapi/v1/accountSnapshot');
      const balances = snapshot.snapshotVos?.[0]?.data?.balances || [];
      const filtered = balances.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
      if (filtered.length > 0) {
        return filtered;
      }
    } catch (snapshotError) {
      console.log('[Binance] Snapshot failed for balances, trying /v3/account...');
    }

    // Fallback to regular account endpoint
    const account = await this.signedRequest('/v3/account');
    return account.balances.filter(
      (b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  }

  /**
   * Get all current prices
   * Read-only public endpoint
   */
  async getAllPrices(): Promise<Array<{ symbol: string; price: string }>> {
    const response = await fetch(`${this.baseUrl}/v3/ticker/price`, {
      signal: createTimeoutSignal(10000),
    });
    const data = await response.json();
    return data;
  }

  /**
   * Validate API keys by making a test request
   * Returns detailed validation result
   */
  async validateKeys(): Promise<{ valid: boolean; error?: string; details?: string }> {
    try {
      console.log('[Binance] Starting validation...');
      console.log('[Binance] Using URL:', this.baseUrl);

      // Step 1: Test connectivity by getting server time
      console.log('[Binance] Step 1: Testing connectivity...');
      const serverTime = await this.syncTime();
      console.log('[Binance] Server time sync successful:', new Date(serverTime).toISOString());

      // Step 2: Test API key format by making a signed request
      console.log('[Binance] Step 2: Testing API key with signed request...');

      try {
        const account = await this.getAccount();
        console.log('[Binance] Account request successful!');

        // If we got here, the API keys are valid and working
        return { valid: true };
      } catch (apiError: any) {
        console.error('[Binance] API Error details:', apiError);

        const errorMsg = apiError.message || String(apiError);

        // Parse Binance specific error codes
        if (errorMsg.includes('-2014')) {
          return {
            valid: false,
            error: 'Invalid API Key. Please check that you copied the entire key without spaces.',
            details: 'Error code: -2014'
          };
        }

        if (errorMsg.includes('-2015')) {
          return {
            valid: false,
            error: 'Invalid API Secret Key. The signature verification failed. Please check your Secret Key.',
            details: 'Error code: -2015'
          };
        }

        if (errorMsg.includes('API-key format invalid')) {
          return {
            valid: false,
            error: 'Invalid API Key format. Binance API keys should start with your configured prefix and be 64 characters long.',
            details: 'Make sure you copied the entire key'
          };
        }

        if (errorMsg.includes('signature') || errorMsg.includes('Signature')) {
          return {
            valid: false,
            error: 'Invalid API Secret Key. The signature verification failed.',
            details: 'Double-check your Secret Key'
          };
        }

        if (errorMsg.includes('IP')) {
          return {
            valid: false,
            error: 'IP address not authorized. Please check your IP restrictions in Binance API settings.',
            details: 'Either remove IP restrictions or add your server IP'
          };
        }

        if (errorMsg.includes('Timestamp')) {
          return {
            valid: false,
            error: 'Time synchronization error. Please try again.',
            details: 'Your system clock may be incorrect'
          };
        }

        if (errorMsg.includes('permission') || errorMsg.includes('-2015')) {
          return {
            valid: false,
            error: 'Insufficient permissions. Please enable "Enable Reading" permission in Binance API settings.',
            details: 'If that doesn\'t work, also enable "Enable Spot & Margin" (safe - we only read data, never trade)'
          };
        }

        // Return the original error if we can't parse it
        return {
          valid: false,
          error: errorMsg,
          details: 'Please check your API key permissions and settings'
        };
      }

    } catch (error: any) {
      console.error('[Binance] Validation error:', error);

      if (error.message?.includes('Cannot connect')) {
        return {
          valid: false,
          error: 'Cannot connect to Binance server. Please check your internet connection and try again.',
          details: 'Network error'
        };
      }

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return {
          valid: false,
          error: 'Request timed out. Binance server may be slow or unreachable.',
          details: 'Please try again'
        };
      }

      return {
        valid: false,
        error: error.message || 'Unknown error occurred',
        details: 'Please try again'
      };
    }
  }

  /**
   * Get balances with USD values
   * Calculates estimated USD value for each asset
   */
  async getBalancesWithUSDValue(): Promise<Array<{
    asset: string;
    free: number;
    locked: number;
    total: number;
    valueUSD?: number;
  }>> {
    const balances = await this.getBalances();
    const prices = await this.getAllPrices();
    const priceMap = new Map(prices.map((p) => [p.symbol, parseFloat(p.price)]));

    return balances.map((balance) => {
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;

      let valueUSD: number | undefined;
      // Try to get USD value for the asset
      const usdtPair = `${balance.asset}USDT`;
      const busdPair = `${balance.asset}BUSD`;
      const btcPrice = priceMap.get('BTCUSDT');

      if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
        valueUSD = total;
      } else if (priceMap.has(usdtPair)) {
        valueUSD = total * priceMap.get(usdtPair)!;
      } else if (priceMap.has(busdPair)) {
        valueUSD = total * priceMap.get(busdPair)!;
      } else if (priceMap.has(`${balance.asset}BTC`) && btcPrice) {
        const btcValue = total * priceMap.get(`${balance.asset}BTC`)!;
        valueUSD = btcValue * btcPrice;
      }

      return {
        asset: balance.asset,
        free,
        locked,
        total,
        valueUSD,
      };
    });
  }
}

/**
 * Encryption utilities for API keys
 * Uses AES-256-CBC encryption for secure storage
 */
export class BinanceEncryption {
  private static getEncryptionKey(): Buffer {
    const key = process.env.BINANCE_ENCRYPTION_KEY || 'default-32-character-key-change-me!!!';
    // Ensure key is exactly 32 bytes for AES-256
    return Buffer.from(key.padEnd(32, '0').slice(0, 32));
  }

  /**
   * Encrypt a string using AES-256-CBC
   */
  static encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a string using AES-256-CBC
   */
  static decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0]!, 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
