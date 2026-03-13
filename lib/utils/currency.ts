/**
 * Currency utilities for formatting and displaying currencies
 */

/**
 * Normalize currency code - handle common aliases
 * NTD is an alias for TWD (Taiwan Dollar)
 */
export function normalizeCurrencyCode(currency: string): string {
  const code = currency?.toUpperCase().trim();
  if (code === 'NTD') {
    return 'TWD';
  }
  return code;
}

// Common currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  TWD: 'NT$',
  NTD: 'NT$', // Alias for TWD (Taiwan Dollar)
  IDR: 'Rp',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  VND: '₫',
  PHP: '₱',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  KRW: '₩',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  RUB: '₽',
  BRL: 'R$',
  MXN: 'MX$',
  ZAR: 'R',
  TRY: '₺',
  AED: 'د.إ',
  SAR: '﷼',
};

// Locale map for proper number formatting
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  TWD: 'zh-TW',
  NTD: 'zh-TW', // Alias for TWD
  IDR: 'id-ID',
  SGD: 'en-SG',
  MYR: 'ms-MY',
  THB: 'th-TH',
  VND: 'vi-VN',
  PHP: 'en-PH',
  INR: 'en-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  KRW: 'ko-KR',
  HKD: 'zh-HK',
  NZD: 'en-NZ',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  RUB: 'ru-RU',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ZAR: 'en-ZA',
  TRY: 'tr-TR',
  AED: 'ar-AE',
  SAR: 'ar-SA',
};

/**
 * Format currency value with proper symbol and locale
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'USD',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options || {};

  const code = normalizeCurrencyCode(currencyCode);
  const locale = CURRENCY_LOCALES[code] || 'en-US';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? code : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);

    return formatted;
  } catch {
    // Fallback formatting
    const symbol = CURRENCY_SYMBOLS[code] || code + ' ';
    if (showSymbol) {
      return symbol + value.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
      });
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const code = normalizeCurrencyCode(currencyCode);
  return CURRENCY_SYMBOLS[code] || code + ' ';
}

/**
 * Format compact currency (e.g., 1.2M, 3.4K)
 */
export function formatCompactCurrency(
  value: number,
  currencyCode: string = 'USD'
): string {
  const code = normalizeCurrencyCode(currencyCode);
  const locale = CURRENCY_LOCALES[code] || 'en-US';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(value);

    return formatted;
  } catch {
    // Fallback
    const symbol = CURRENCY_SYMBOLS[code] || code + ' ';
    if (value >= 1000000) {
      return symbol + (value / 1000000).toFixed(2) + 'M';
    }
    if (value >= 1000) {
      return symbol + (value / 1000).toFixed(2) + 'K';
    }
    return symbol + value.toFixed(2);
  }
}

/**
 * Validate currency code (3-letter ISO 4217 code)
 */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/i.test(code);
}

/**
 * Popular currencies for quick selection
 */
export const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'NTD', name: 'Taiwan Dollar (NTD)', symbol: 'NT$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

/**
 * All available currencies for autocomplete
 */
export const ALL_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'NTD', name: 'Taiwan Dollar (NTD)', symbol: 'NT$' },
  { code: 'TWD', name: 'Taiwan Dollar (TWD)', symbol: 'NT$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
];
