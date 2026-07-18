export type CountryCode = "US" | "ET" | "ER" | "KE" | "UG";

export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

export type CountryDefaults = {
  countryCode: CountryCode;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: DateFormat;
};

export type BusinessConfig = {
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
};
