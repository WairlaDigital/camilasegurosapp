// Peruvian mobile numbers, shared by the holder form and its Server Action.

/** 9 digits starting with 9. */
export const PHONE_LENGTH = 9;

/** Digits only, without Peru's +51 prefix: "+51 987-654-321" → "987654321". */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > PHONE_LENGTH && digits.startsWith("51") ? digits.slice(2) : digits;
}

/** What the phone field keeps while typing or pasting (a pasted +51 prefix is dropped first). */
export function limitPhone(value: string): string {
  return normalizePhone(value).slice(0, PHONE_LENGTH);
}
