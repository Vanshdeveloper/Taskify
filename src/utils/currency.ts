export interface CurrencyOption {
  symbol: string;
  code: string;
  name: string;
  label: string;
}

export const POPULAR_CURRENCIES: CurrencyOption[] = [
  { symbol: '$', code: 'USD', name: 'US Dollar', label: '$ — USD (United States)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee', label: '₹ — INR (India)' },
  { symbol: '€', code: 'EUR', name: 'Euro', label: '€ — EUR (Eurozone)' },
  { symbol: '£', code: 'GBP', name: 'British Pound', label: '£ — GBP (United Kingdom)' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen', label: '¥ — JPY (Japan)' },
  { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar', label: 'CA$ — CAD (Canada)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', label: 'A$ — AUD (Australia)' },
  { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', label: 'CHF — CHF (Switzerland)' },
  { symbol: '₩', code: 'KRW', name: 'South Korean Won', label: '₩ — KRW (South Korea)' },
  { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', label: 'R$ — BRL (Brazil)' },
  { symbol: '₺', code: 'TRY', name: 'Turkish Lira', label: '₺ — TRY (Turkey)' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham', label: 'AED — AED (Emirates)' },
  { symbol: 'SG$', code: 'SGD', name: 'Singapore Dollar', label: 'SG$ — SGD (Singapore)' },
  { symbol: 'kr', code: 'SEK', name: 'Swedish Krona', label: 'kr — SEK (Sweden)' },
  { symbol: 'zł', code: 'PLN', name: 'Polish Złoty', label: 'zł — PLN (Poland)' },
];

/**
 * Pure local currency autodetect using browser locale and timezone
 * Zero external network APIs or tracking required.
 */
export function autodetectCurrency(): CurrencyOption {
  if (typeof window === 'undefined') {
    return POPULAR_CURRENCIES[0];
  }

  const locale = navigator.language || 'en-US';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  // India
  if (
    timeZone.includes('Calcutta') ||
    timeZone.includes('Kolkata') ||
    locale.includes('IN') ||
    locale.startsWith('hi') ||
    locale.startsWith('ta') ||
    locale.startsWith('te') ||
    locale.startsWith('bn') ||
    locale.startsWith('mr') ||
    locale.startsWith('gu')
  ) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'INR')!;
  }

  // UK
  if (timeZone.includes('London') || locale === 'en-GB') {
    return POPULAR_CURRENCIES.find((c) => c.code === 'GBP')!;
  }

  // Japan
  if (timeZone.includes('Tokyo') || locale.startsWith('ja')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'JPY')!;
  }

  // Eurozone
  const euroTimeZones = ['Berlin', 'Paris', 'Rome', 'Madrid', 'Amsterdam', 'Brussels', 'Vienna', 'Dublin', 'Helsinki', 'Athens', 'Lisbon'];
  if (euroTimeZones.some((tz) => timeZone.includes(tz)) || ['de', 'fr', 'it', 'es', 'nl', 'el', 'pt'].some((l) => locale.startsWith(l))) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'EUR')!;
  }

  // Canada
  if (timeZone.includes('Toronto') || timeZone.includes('Vancouver') || timeZone.includes('Montreal') || locale.includes('CA')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'CAD')!;
  }

  // Australia
  if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || timeZone.includes('Brisbane') || timeZone.includes('Perth') || locale.includes('AU')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'AUD')!;
  }

  // Switzerland
  if (timeZone.includes('Zurich') || locale.includes('CH')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'CHF')!;
  }

  // South Korea
  if (timeZone.includes('Seoul') || locale.startsWith('ko')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'KRW')!;
  }

  // Brazil
  if (timeZone.includes('Sao_Paulo') || locale.includes('BR')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'BRL')!;
  }

  // UAE
  if (timeZone.includes('Dubai') || locale.includes('AE')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'AED')!;
  }

  // Turkey
  if (timeZone.includes('Istanbul') || locale.startsWith('tr')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'TRY')!;
  }

  // Singapore
  if (timeZone.includes('Singapore') || locale.includes('SG')) {
    return POPULAR_CURRENCIES.find((c) => c.code === 'SGD')!;
  }

  // Default: US Dollar
  return POPULAR_CURRENCIES[0];
}
