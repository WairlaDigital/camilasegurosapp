// The plate already has an active SOAT: the flow stops on its own screen. The expiry
// date travels in the URL (it is not personal data) so the screen needs no session.

export const ACTIVE_POLICY_PATH = "/cotizar/soat-vigente";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function activePolicyHref(expiresAt: string | undefined): string {
  return expiresAt ? `${ACTIVE_POLICY_PATH}?vence=${expiresAt}` : ACTIVE_POLICY_PATH;
}

/** `?vence=` of the screen: a real YYYY-MM-DD date, or nothing. */
export function expiryFromQuery(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !ISO_DATE.test(raw)) return undefined;
  const date = new Date(`${raw}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(raw) ? raw : undefined;
}
