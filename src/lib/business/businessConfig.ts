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
