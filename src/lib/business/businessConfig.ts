import type { CountryCode, CountryDefaults, DateFormat } from "./types";

/**
 * Pure, stateless Business-Configuration helpers - v1.2 foundation. Country
 * selection auto-populates currency/symbol/timezone/date-format as a
 * starting point; the owner may override any of them before saving (the
 * saved values, not this map, are always the source of truth once a
 * business has configured itself). Deliberately a small, hardcoded map
 * rather than a database table for this first phase - "at least" these 5
 * countries per the v1.2 scope, with more to follow in a later phase.
 */

export const COUNTRY_DEFAULTS: Record<CountryCode, CountryDefaults> = {
  US: {
    countryCode: "US",
    countryName: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
  },
  ET: {
    countryCode: "ET",
    countryName: "Ethiopia",
    currencyCode: "ETB",
    currencySymbol: "Br",
    timezone: "Africa/Addis_Ababa",
    dateFormat: "DD/MM/YYYY",
  },
  ER: {
    countryCode: "ER",
    countryName: "Eritrea",
    currencyCode: "ERN",
    currencySymbol: "Nfk",
    timezone: "Africa/Asmara",
    dateFormat: "DD/MM/YYYY",
  },
  KE: {
    countryCode: "KE",
    countryName: "Kenya",
    currencyCode: "KES",
    currencySymbol: "KSh",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
  },
  UG: {
    countryCode: "UG",
    countryName: "Uganda",
    currencyCode: "UGX",
    currencySymbol: "USh",
    timezone: "Africa/Kampala",
    dateFormat: "DD/MM/YYYY",
  },
};

/** Dropdown options, in the map's own (deliberately curated) order. */
export const COUNTRY_OPTIONS: { code: CountryCode; name: string }[] =
  (Object.keys(COUNTRY_DEFAULTS) as CountryCode[]).map((code) => ({
    code,
    name: COUNTRY_DEFAULTS[code].countryName,
  }));

/**
 * Broader world-currency reference, separate from COUNTRY_DEFAULTS above.
 * COUNTRY_DEFAULTS stays the small, curated "pick your country and get
 * sensible defaults" set (still the only thing Settings' country picker
 * offers); this list exists for pickers that want currency flexibility
 * independent of country selection - e.g. Wegn AI Onboarding's currency
 * step - without inventing a second hardcoded, narrower list (that's
 * exactly the gap this replaces: onboarding previously had its own
 * USD/EUR/GBP/CAD-only list that didn't even include Ethiopia, the
 * primary market this list is for). Includes every COUNTRY_DEFAULTS
 * currency plus other common currencies across the regions Wegn
 * operates in.
 */
export type CurrencyOption = { code: string; label: string; symbol: string };

export const WORLD_CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "ETB", label: "Ethiopian Birr", symbol: "Br" },
  { code: "ERN", label: "Eritrean Nakfa", symbol: "Nfk" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh" },
  { code: "SOS", label: "Somali Shilling", symbol: "Sh" },
  { code: "RWF", label: "Rwandan Franc", symbol: "FRw" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "₵" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "EGP", label: "Egyptian Pound", symbol: "E£" },
  { code: "SDG", label: "Sudanese Pound", symbol: "SDG" },
  { code: "MAD", label: "Moroccan Dirham", symbol: "MAD" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
];

export function getCurrencyOption(code: string): CurrencyOption | null {
  return WORLD_CURRENCIES.find((c) => c.code === code) ?? null;
}

export function isSupportedCountryCode(code: string): code is CountryCode {
  return Object.prototype.hasOwnProperty.call(COUNTRY_DEFAULTS, code);
}

/** Null for a country outside the initial supported set - callers should
 *  leave whatever the field already holds rather than force a value. */
export function getCountryDefaults(countryCode: string): CountryDefaults | null {
  return isSupportedCountryCode(countryCode) ? COUNTRY_DEFAULTS[countryCode] : null;
}

/**
 * Formats a monetary amount using the business's configured currency
 * symbol. Purely a display concern - never converts the underlying number,
 * only changes how it's represented (per the v1.2 currency requirement).
 * Falls back to "$" if no symbol is configured, matching every existing
 * call site's prior hardcoded behavior.
 */
export function formatMoney(amount: number, currencySymbol: string | null | undefined): string {
  const symbol = currencySymbol || "$";
  const value = Number(amount) || 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}${symbol}${Math.abs(value).toFixed(2)}`;
}

/** Formats a Date using the business's configured date format - a display
 *  concern only; storage/comparison always stays in ISO/timestamptz. */
export function formatBusinessDate(date: Date, dateFormat: DateFormat | string): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  if (dateFormat === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`;
  if (dateFormat === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}
