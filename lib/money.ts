export type Currency = "PEN" | "USD";

const formatters = new Map<Currency, Intl.NumberFormat>();

/**
 * Formats integer cents for display ("S/ 210.00"). The space after the symbol
 * is non-breaking, so the currency never wraps apart from the amount.
 */
export function formatMoney(cents: number, currency: Currency = "PEN"): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-PE", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(cents / 100).replace(/\s/g, " ");
}
