import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COUNTRY_DEFAULTS,
  COUNTRY_OPTIONS,
  isSupportedCountryCode,
  getCountryDefaults,
  formatMoney,
  formatBusinessDate,
} from "./businessConfig.ts";

test("COUNTRY_DEFAULTS covers all 5 launch countries with distinct currencies", () => {
  const codes = Object.keys(COUNTRY_DEFAULTS).sort();
  assert.deepEqual(codes, ["ER", "ET", "KE", "UG", "US"]);
  const currencies = new Set(Object.values(COUNTRY_DEFAULTS).map((c) => c.currencyCode));
  assert.equal(currencies.size, 5);
});

test("COUNTRY_OPTIONS has one entry per supported country with a matching name", () => {
  assert.equal(COUNTRY_OPTIONS.length, 5);
  for (const opt of COUNTRY_OPTIONS) {
    assert.equal(opt.name, COUNTRY_DEFAULTS[opt.code].countryName);
  }
});

test("isSupportedCountryCode recognizes exactly the 5 launch countries", () => {
  assert.equal(isSupportedCountryCode("US"), true);
  assert.equal(isSupportedCountryCode("ET"), true);
  assert.equal(isSupportedCountryCode("FR"), false);
  assert.equal(isSupportedCountryCode(""), false);
});

test("getCountryDefaults returns the full default bundle for a supported country", () => {
  const defaults = getCountryDefaults("KE");
  assert.deepEqual(defaults, {
    countryCode: "KE",
    countryName: "Kenya",
    currencyCode: "KES",
    currencySymbol: "KSh",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
  });
});

test("getCountryDefaults returns null for a country outside the initial supported set", () => {
  assert.equal(getCountryDefaults("FR"), null);
  assert.equal(getCountryDefaults(""), null);
});

test("formatMoney formats a positive amount with the given symbol, always 2 decimals", () => {
  assert.equal(formatMoney(14.5, "KSh"), "KSh14.50");
  assert.equal(formatMoney(0, "$"), "$0.00");
});

test("formatMoney puts the minus sign before the symbol for negative amounts", () => {
  assert.equal(formatMoney(-13, "$"), "-$13.00");
});

test("formatMoney falls back to $ when no symbol is configured, matching prior hardcoded behavior", () => {
  assert.equal(formatMoney(10, null), "$10.00");
  assert.equal(formatMoney(10, undefined), "$10.00");
  assert.equal(formatMoney(10, ""), "$10.00");
});

test("formatMoney never converts the amount - only changes the symbol", () => {
  assert.equal(formatMoney(99.99, "Br"), "Br99.99");
  assert.equal(formatMoney(99.99, "USh"), "USh99.99");
});

test("formatBusinessDate formats MM/DD/YYYY correctly", () => {
  const d = new Date(2026, 6, 5); // July 5, 2026
  assert.equal(formatBusinessDate(d, "MM/DD/YYYY"), "07/05/2026");
});

test("formatBusinessDate formats DD/MM/YYYY correctly", () => {
  const d = new Date(2026, 6, 5);
  assert.equal(formatBusinessDate(d, "DD/MM/YYYY"), "05/07/2026");
});

test("formatBusinessDate formats YYYY-MM-DD correctly", () => {
  const d = new Date(2026, 6, 5);
  assert.equal(formatBusinessDate(d, "YYYY-MM-DD"), "2026-07-05");
});
