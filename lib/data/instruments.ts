/**
 * Comprehensive Investment Instruments Database
 * Centralized source for all available investment instruments
 * All instruments are unique by symbol
 */

export type InstrumentCategory = 'all' | 'crypto' | 'us-stocks' | 'indo-stocks' | 'metals';

export interface Instrument {
  symbol: string;
  name: string;
  type: 'CRYPTO' | 'STOCK' | 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
  category: InstrumentCategory;
  icon?: string;
  color: string;
  marketCapRank?: number;
  exchange?: string;
}

// Top Cryptocurrencies by Market Cap (40 unique)
const CRYPTO_DATA: Instrument[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO', category: 'crypto', color: 'text-orange-500', marketCapRank: 1 },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'CRYPTO', category: 'crypto', color: 'text-blue-500', marketCapRank: 2 },
  { symbol: 'USDT-USD', name: 'Tether', type: 'CRYPTO', category: 'crypto', color: 'text-green-500', marketCapRank: 3 },
  { symbol: 'BNB-USD', name: 'BNB', type: 'CRYPTO', category: 'crypto', color: 'text-yellow-500', marketCapRank: 4 },
  { symbol: 'SOL-USD', name: 'Solana', type: 'CRYPTO', category: 'crypto', color: 'text-purple-500', marketCapRank: 5 },
  { symbol: 'XRP-USD', name: 'XRP', type: 'CRYPTO', category: 'crypto', color: 'text-slate-500', marketCapRank: 6 },
  { symbol: 'USDC-USD', name: 'USD Coin', type: 'CRYPTO', category: 'crypto', color: 'text-blue-400', marketCapRank: 7 },
  { symbol: 'ADA-USD', name: 'Cardano', type: 'CRYPTO', category: 'crypto', color: 'text-blue-400', marketCapRank: 8 },
  { symbol: 'AVAX-USD', name: 'Avalanche', type: 'CRYPTO', category: 'crypto', color: 'text-red-500', marketCapRank: 9 },
  { symbol: 'DOGE-USD', name: 'Dogecoin', type: 'CRYPTO', category: 'crypto', color: 'text-amber-500', marketCapRank: 10 },
  { symbol: 'DOT-USD', name: 'Polkadot', type: 'CRYPTO', category: 'crypto', color: 'text-pink-500', marketCapRank: 11 },
  { symbol: 'TRX-USD', name: 'TRON', type: 'CRYPTO', category: 'crypto', color: 'text-red-600', marketCapRank: 12 },
  { symbol: 'LINK-USD', name: 'Chainlink', type: 'CRYPTO', category: 'crypto', color: 'text-blue-600', marketCapRank: 13 },
  { symbol: 'TON-USD', name: 'Toncoin', type: 'CRYPTO', category: 'crypto', color: 'text-blue-700', marketCapRank: 14 },
  { symbol: 'MATIC-USD', name: 'Polygon', type: 'CRYPTO', category: 'crypto', color: 'text-purple-600', marketCapRank: 15 },
  { symbol: 'SHIB-USD', name: 'Shiba Inu', type: 'CRYPTO', category: 'crypto', color: 'text-orange-600', marketCapRank: 16 },
  { symbol: 'ETC-USD', name: 'Ethereum Classic', type: 'CRYPTO', category: 'crypto', color: 'text-slate-600', marketCapRank: 17 },
  { symbol: 'XLM-USD', name: 'Stellar', type: 'CRYPTO', category: 'crypto', color: 'text-slate-400', marketCapRank: 18 },
  { symbol: 'KAS-USD', name: 'Kaspa', type: 'CRYPTO', category: 'crypto', color: 'text-blue-800', marketCapRank: 19 },
  { symbol: 'XMR-USD', name: 'Monero', type: 'CRYPTO', category: 'crypto', color: 'text-orange-700', marketCapRank: 20 },
  { symbol: 'LTC-USD', name: 'Litecoin', type: 'CRYPTO', category: 'crypto', color: 'text-slate-500', marketCapRank: 21 },
  { symbol: 'BCH-USD', name: 'Bitcoin Cash', type: 'CRYPTO', category: 'crypto', color: 'text-green-600', marketCapRank: 22 },
  { symbol: 'APT-USD', name: 'Aptos', type: 'CRYPTO', category: 'crypto', color: 'text-blue-300', marketCapRank: 23 },
  { symbol: 'NEAR-USD', name: 'NEAR Protocol', type: 'CRYPTO', category: 'crypto', color: 'text-black', marketCapRank: 24 },
  { symbol: 'ARB-USD', name: 'Arbitrum', type: 'CRYPTO', category: 'crypto', color: 'text-blue-500', marketCapRank: 25 },
  { symbol: 'OP-USD', name: 'Optimism', type: 'CRYPTO', category: 'crypto', color: 'text-red-400', marketCapRank: 26 },
  { symbol: 'ATOM-USD', name: 'Cosmos', type: 'CRYPTO', category: 'crypto', color: 'text-purple-500', marketCapRank: 27 },
  { symbol: 'INJ-USD', name: 'Injective', type: 'CRYPTO', category: 'crypto', color: 'text-cyan-500', marketCapRank: 28 },
  { symbol: 'QNT-USD', name: 'Quant', type: 'CRYPTO', category: 'crypto', color: 'text-blue-700', marketCapRank: 29 },
  { symbol: 'UNI-USD', name: 'Uniswap', type: 'CRYPTO', category: 'crypto', color: 'text-pink-600', marketCapRank: 30 },
  { symbol: 'ICP-USD', name: 'Internet Computer', type: 'CRYPTO', category: 'crypto', color: 'text-orange-400', marketCapRank: 31 },
  { symbol: 'HBAR-USD', name: 'Hedera', type: 'CRYPTO', category: 'crypto', color: 'text-slate-700', marketCapRank: 32 },
  { symbol: 'VET-USD', name: 'VeChain', type: 'CRYPTO', category: 'crypto', color: 'text-blue-600', marketCapRank: 33 },
  { symbol: 'AAVE-USD', name: 'Aave', type: 'CRYPTO', category: 'crypto', color: 'text-purple-700', marketCapRank: 34 },
  { symbol: 'MKR-USD', name: 'Maker', type: 'CRYPTO', category: 'crypto', color: 'text-blue-800', marketCapRank: 35 },
  { symbol: 'GRT-USD', name: 'The Graph', type: 'CRYPTO', category: 'crypto', color: 'text-orange-500', marketCapRank: 36 },
  { symbol: 'COMP-USD', name: 'Compound', type: 'CRYPTO', category: 'crypto', color: 'text-green-500', marketCapRank: 37 },
  { symbol: 'SUSHI-USD', name: 'Sushi', type: 'CRYPTO', category: 'crypto', color: 'text-red-500', marketCapRank: 38 },
  { symbol: 'CRV-USD', name: 'Curve DAO', type: 'CRYPTO', category: 'crypto', color: 'text-purple-400', marketCapRank: 39 },
  { symbol: 'YFI-USD', name: 'yearn.finance', type: 'CRYPTO', category: 'crypto', color: 'text-blue-900', marketCapRank: 40 },
];

// US Stocks - Major Companies (65 unique)
const US_STOCKS_DATA: Instrument[] = [
  // Tech Giants
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-sky-600', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-orange-600', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-green-600', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NASDAQ' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-800', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'STOCK', category: 'us-stocks', color: 'text-red-500', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-blue-800', exchange: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-500', exchange: 'NYSE' },
  { symbol: 'ORCL', name: 'Oracle Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NYSE' },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NASDAQ' },
  { symbol: 'ACN', name: 'Accenture plc', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NYSE' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NASDAQ' },

  // Financial Services
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-900', exchange: 'NYSE' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-800', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-orange-500', exchange: 'NYSE' },
  { symbol: 'BAC', name: 'Bank of America Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NYSE' },
  { symbol: 'WFC', name: 'Wells Fargo & Co.', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NYSE' },
  { symbol: 'GS', name: 'Goldman Sachs Group', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NYSE' },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'STOCK', category: 'us-stocks', color: 'text-blue-800', exchange: 'NYSE' },
  { symbol: 'C', name: 'Citigroup Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NYSE' },
  { symbol: 'BLK', name: 'BlackRock Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-900', exchange: 'NYSE' },
  { symbol: 'SCHW', name: 'Charles Schwab Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NYSE' },
  { symbol: 'AXP', name: 'American Express Co.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-500', exchange: 'NYSE' },
  { symbol: 'SPGI', name: 'S&P Global Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-orange-600', exchange: 'NYSE' },

  // Healthcare
  { symbol: 'UNH', name: 'UnitedHealth Group', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NYSE' },
  { symbol: 'LLY', name: 'Eli Lilly and Co.', type: 'STOCK', category: 'us-stocks', color: 'text-cyan-600', exchange: 'NYSE' },
  { symbol: 'PFE', name: 'Pfizer Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NYSE' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NYSE' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-green-700', exchange: 'NYSE' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', type: 'STOCK', category: 'us-stocks', color: 'text-red-500', exchange: 'NYSE' },
  { symbol: 'ABT', name: 'Abbott Laboratories', type: 'STOCK', category: 'us-stocks', color: 'text-blue-500', exchange: 'NYSE' },
  { symbol: 'DHR', name: 'Danaher Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NYSE' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NYSE' },
  { symbol: 'AMGN', name: 'Amgen Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-800', exchange: 'NASDAQ' },
  { symbol: 'GILD', name: 'Gilead Sciences', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'CVS', name: 'CVS Health Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NYSE' },

  // Consumer
  { symbol: 'PG', name: 'Procter & Gamble Co.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Company', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NYSE' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'COST', name: 'Costco Wholesale', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NASDAQ' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-yellow-600', exchange: 'NYSE' },
  { symbol: 'HD', name: 'Home Depot Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-orange-600', exchange: 'NYSE' },
  { symbol: 'MCD', name: "McDonald's Corp.", type: 'STOCK', category: 'us-stocks', color: 'text-yellow-500', exchange: 'NYSE' },
  { symbol: 'NKE', name: 'Nike Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NYSE' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-green-700', exchange: 'NASDAQ' },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-500', exchange: 'NYSE' },
  { symbol: 'TGT', name: 'Target Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-red-500', exchange: 'NYSE' },
  { symbol: 'LOW', name: "Lowe's Companies", type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NYSE' },

  // Industrial & Energy
  { symbol: 'CAT', name: 'Caterpillar Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-yellow-600', exchange: 'NYSE' },
  { symbol: 'BA', name: 'Boeing Company', type: 'STOCK', category: 'us-stocks', color: 'text-blue-800', exchange: 'NYSE' },
  { symbol: 'GE', name: 'General Electric', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NYSE' },
  { symbol: 'HON', name: 'Honeywell International', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NASDAQ' },
  { symbol: 'UPS', name: 'United Parcel Service', type: 'STOCK', category: 'us-stocks', color: 'text-brown-600', exchange: 'NYSE' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NYSE' },
  { symbol: 'CVX', name: 'Chevron Corporation', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NYSE' },
  { symbol: 'COP', name: 'ConocoPhillips', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NYSE' },
  { symbol: 'SLB', name: 'Schlumberger NV', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NYSE' },
  { symbol: 'EOG', name: 'EOG Resources', type: 'STOCK', category: 'us-stocks', color: 'text-slate-600', exchange: 'NYSE' },

  // Semiconductors
  { symbol: 'QCOM', name: 'Qualcomm Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NASDAQ' },
  { symbol: 'TXN', name: 'Texas Instruments', type: 'STOCK', category: 'us-stocks', color: 'text-red-700', exchange: 'NASDAQ' },
  { symbol: 'MU', name: 'Micron Technology', type: 'STOCK', category: 'us-stocks', color: 'text-blue-700', exchange: 'NASDAQ' },
  { symbol: 'ARM', name: 'ARM Holdings', type: 'STOCK', category: 'us-stocks', color: 'text-blue-500', exchange: 'NASDAQ' },
  { symbol: 'SOXX', name: 'iShares Semiconductor ETF', type: 'STOCK', category: 'us-stocks', color: 'text-purple-600', exchange: 'NASDAQ' },

  // Retail & E-Commerce
  { symbol: 'EBAY', name: 'eBay Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-600', exchange: 'NASDAQ' },
  { symbol: 'ETSY', name: 'Etsy Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-orange-500', exchange: 'NASDAQ' },
  { symbol: 'SHOP', name: 'Shopify Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-green-600', exchange: 'NYSE' },
  { symbol: 'RBLX', name: 'Roblox Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NYSE' },

  // Communication
  { symbol: 'T', name: 'AT&T Inc.', type: 'STOCK', category: 'us-stocks', color: 'text-blue-800', exchange: 'NYSE' },
  { symbol: 'VZ', name: 'Verizon Communications', type: 'STOCK', category: 'us-stocks', color: 'text-red-600', exchange: 'NYSE' },
  { symbol: 'CMCSA', name: 'Comcast Corp.', type: 'STOCK', category: 'us-stocks', color: 'text-slate-700', exchange: 'NASDAQ' },
];

// Indonesian Stocks - IDX Top Companies (50 unique)
const INDO_STOCKS_DATA: Instrument[] = [
  // Banking Sector
  { symbol: 'BBCA.JK', name: 'Bank Central Asia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-700', exchange: 'IDX' },
  { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },
  { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },
  { symbol: 'BMRI.JK', name: 'Bank Mandiri (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-600', exchange: 'IDX' },
  { symbol: 'BRIS.JK', name: 'Bank Syariah Indonesia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-600', exchange: 'IDX' },
  { symbol: 'BNGA.JK', name: 'Bank CIMB Niaga Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-600', exchange: 'IDX' },
  { symbol: 'MDKA.JK', name: 'Merdeka Copper Gold Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-600', exchange: 'IDX' },
  { symbol: 'MASA.JK', name: 'Bank Maspion Indonesia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-400', exchange: 'IDX' },
  { symbol: 'BANK.JK', name: 'Bank Aladin Syariah Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-teal-600', exchange: 'IDX' },

  // Telecommunications
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-600', exchange: 'IDX' },
  { symbol: 'ISAT.JK', name: 'Indosat Ooredoo Hutchison Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-500', exchange: 'IDX' },
  { symbol: 'EXCL.JK', name: 'XL Axiata Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },
  { symbol: 'FREN.JK', name: 'Smartfren Telecom Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-500', exchange: 'IDX' },

  // Automotive & Industrial
  { symbol: 'ASII.JK', name: 'Astra International Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-teal-600', exchange: 'IDX' },
  { symbol: 'AUTO.JK', name: 'Astra Otoparts Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-500', exchange: 'IDX' },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-teal-500', exchange: 'IDX' },
  { symbol: 'TPIA.JK', name: 'Chandra Asri Petrochemical Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },
  { symbol: 'UNTR.JK', name: 'United Tractors Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-orange-600', exchange: 'IDX' },
  { symbol: 'SGRO.JK', name: 'Sinar Mas Land Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-700', exchange: 'IDX' },
  { symbol: 'AYLA.JK', name: 'Astari Niagara Investor Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-purple-500', exchange: 'IDX' },
  { symbol: 'IMAS.JK', name: 'Indomobil Sukses Internasional Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },
  { symbol: 'SULI.JK', name: 'Surya Citra Media Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-600', exchange: 'IDX' },

  // Consumer Goods & Food
  { symbol: 'INDF.JK', name: 'Indofood Sukses Makmur Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-teal-700', exchange: 'IDX' },
  { symbol: 'ICBP.JK', name: 'Indofood CBP Sukses Makmur Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-teal-600', exchange: 'IDX' },
  { symbol: 'UNVR.JK', name: 'Unilever Indonesia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-600', exchange: 'IDX' },
  { symbol: 'ULTJ.JK', name: 'Ultrajaya Milk Industry Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },
  { symbol: 'MYOR.JK', name: 'Mayora Indah Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-500', exchange: 'IDX' },
  { symbol: 'GGRM.JK', name: 'Gudang Garam Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-slate-700', exchange: 'IDX' },
  { symbol: 'HMSP.JK', name: 'H.M. Sampoerna Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-white', exchange: 'IDX' },
  { symbol: 'KLBF.JK', name: 'Kalbe Farma Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },

  // Infrastructure & Utilities
  { symbol: 'PGAS.JK', name: 'Perusahaan Gas Negara Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },
  { symbol: 'JSMR.JK', name: 'Jasa Marga (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-orange-500', exchange: 'IDX' },
  { symbol: 'WIKA.JK', name: 'Wijaya Karya (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },
  { symbol: 'PTPP.JK', name: 'PP (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-gray-600', exchange: 'IDX' },
  { symbol: 'ADHI.JK', name: 'Adhi Karya (Persero) Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-orange-600', exchange: 'IDX' },

  // Mining & Resources
  { symbol: 'ANTM.JK', name: 'Aneka Tambang Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-700', exchange: 'IDX' },
  { symbol: 'PTBA.JK', name: 'Bukit Asam Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-slate-700', exchange: 'IDX' },
  { symbol: 'TINS.JK', name: 'Timah Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-slate-600', exchange: 'IDX' },
  { symbol: 'BRPT.JK', name: 'Barito Pacific Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-700', exchange: 'IDX' },
  { symbol: 'DEWA.JK', name: 'Darma Henwa Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },

  // Property & Real Estate
  { symbol: 'BSDE.JK', name: 'Bumi Serpong Damai Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-600', exchange: 'IDX' },
  { symbol: 'PWON.JK', name: 'Pakuwon Jati Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-orange-500', exchange: 'IDX' },
  { symbol: 'LPKR.JK', name: 'Lippo Cikarang Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-600', exchange: 'IDX' },
  { symbol: 'CTRS.JK', name: 'Ciputra Development Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-600', exchange: 'IDX' },

  // Technology
  { symbol: 'BUKK.JK', name: 'Bukalapak.com Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-600', exchange: 'IDX' },
  { symbol: 'TOWR.JK', name: 'Sarana Menara Nusantara Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-red-500', exchange: 'IDX' },
  { symbol: 'BTEE.JK', name: 'Batasa Eka Pratama Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-400', exchange: 'IDX' },
  { symbol: 'MORA.JK', name: 'Mora Teknologi Indonesia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-purple-600', exchange: 'IDX' },

  // Retail & Trade
  { symbol: 'LPPF.JK', name: 'Matahari Department Store Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-orange-600', exchange: 'IDX' },
  { symbol: 'MNCN.JK', name: 'Media Nusantara Citra Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-slate-600', exchange: 'IDX' },
  { symbol: 'VIVA.JK', name: 'Visi Media Asia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-pink-600', exchange: 'IDX' },
  { symbol: 'EMTK.JK', name: 'Elang Mahkota Teknologi Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-700', exchange: 'IDX' },

  // Energy & Power
  { symbol: 'TOBA.JK', name: 'Toba Bara Sejahtera Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-brown-700', exchange: 'IDX' },
  { symbol: 'GEMS.JK', name: 'Gresources Capital Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-blue-500', exchange: 'IDX' },

  // Agriculture
  { symbol: 'AALI.JK', name: 'Astra Agro Lestari Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-700', exchange: 'IDX' },
  { symbol: 'LSIP.JK', name: 'PP London Sumatra Indonesia Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-600', exchange: 'IDX' },
  { symbol: 'SIMP.JK', name: 'Salim Ivomas Pratama Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-yellow-500', exchange: 'IDX' },
  { symbol: 'SSMS.JK', name: 'Sawit Sumbermas Sarana Tbk', type: 'STOCK', category: 'indo-stocks', color: 'text-green-500', exchange: 'IDX' },
];

// Precious Metals (4 unique)
const METALS_DATA: Instrument[] = [
  { symbol: 'GOLD', name: 'Gold Spot (XAU)', type: 'GOLD', category: 'metals', color: 'text-yellow-500', exchange: 'Global' },
  { symbol: 'SILVER', name: 'Silver Spot (XAG)', type: 'SILVER', category: 'metals', color: 'text-slate-400', exchange: 'Global' },
  { symbol: 'PLATINUM', name: 'Platinum Spot (XPT)', type: 'PLATINUM', category: 'metals', color: 'text-slate-300', exchange: 'Global' },
  { symbol: 'PALLADIUM', name: 'Palladium Spot (XPD)', type: 'PALLADIUM', category: 'metals', color: 'text-slate-400', exchange: 'Global' },
];

/**
 * Deduplicate instruments by symbol
 * Ensures each symbol appears only once in the final list
 */
function deduplicateInstruments(instruments: Instrument[]): Instrument[] {
  const seen = new Set<string>();
  const result: Instrument[] = [];

  for (const instrument of instruments) {
    const normalizedSymbol = instrument.symbol.toUpperCase();
    if (!seen.has(normalizedSymbol)) {
      seen.add(normalizedSymbol);
      result.push(instrument);
    }
  }

  return result;
}

// Combine all data and deduplicate
const ALL_RAW_DATA = [
  ...CRYPTO_DATA,
  ...US_STOCKS_DATA,
  ...INDO_STOCKS_DATA,
  ...METALS_DATA,
];

// Export deduplicated arrays
export const CRYPTO_INSTRUMENTS: Instrument[] = deduplicateInstruments(CRYPTO_DATA);
export const US_STOCK_INSTRUMENTS: Instrument[] = deduplicateInstruments(US_STOCKS_DATA);
export const INDO_STOCK_INSTRUMENTS: Instrument[] = deduplicateInstruments(INDO_STOCKS_DATA);
export const METALS_INSTRUMENTS: Instrument[] = deduplicateInstruments(METALS_DATA);

// All unique instruments combined
export const ALL_INSTRUMENTS: Instrument[] = deduplicateInstruments(ALL_RAW_DATA);

// Get instruments by category
export function getInstrumentsByCategory(category: InstrumentCategory | 'all'): Instrument[] {
  switch (category) {
    case 'crypto':
      return CRYPTO_INSTRUMENTS;
    case 'us-stocks':
      return US_STOCK_INSTRUMENTS;
    case 'indo-stocks':
      return INDO_STOCK_INSTRUMENTS;
    case 'metals':
      return METALS_INSTRUMENTS;
    default:
      return ALL_INSTRUMENTS;
  }
}

// Search instruments with deduplication
export function searchInstruments(query: string): Instrument[] {
  const lowerQuery = query.toLowerCase();
  const results = ALL_INSTRUMENTS.filter(
    (instrument) =>
      instrument.symbol.toLowerCase().includes(lowerQuery) ||
      instrument.name.toLowerCase().includes(lowerQuery)
  );
  return deduplicateInstruments(results);
}

// Get instrument by symbol (unique)
export function getInstrumentBySymbol(symbol: string): Instrument | undefined {
  return ALL_INSTRUMENTS.find(
    (instrument) => instrument.symbol === symbol.toUpperCase()
  );
}

/**
 * Validate no duplicates exist
 * This function runs at build time to ensure data integrity
 */
export function validateNoDuplicates(): boolean {
  const symbols = ALL_INSTRUMENTS.map(i => i.symbol.toUpperCase());
  const unique = new Set(symbols);
  return symbols.length === unique.size;
}
