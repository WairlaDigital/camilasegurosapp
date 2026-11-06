// Seals the quote session for its cookie: deflate, then AES-256-GCM, then base64url.
// Browsers silently drop a cookie over 4096 bytes, and La Positiva's production
// quote token alone is ~680 characters; compressing keeps the cookie near half
// the limit. It decrypts (and so authenticates) before inflating.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";

/** What browsers accept for a cookie's name and value together. */
export const MAX_COOKIE_BYTES = 4096;

const IV_BYTES = 12;
const TAG_BYTES = 16;

const keyFrom = (secret: string) => createHash("sha256").update(secret).digest();

export function sealCookie(value: string, secret: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const data = Buffer.concat([cipher.update(deflateRawSync(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

export function openCookie(sealed: string, secret: string): string | null {
  try {
    const raw = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), raw.subarray(0, IV_BYTES));
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const data = Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
    return inflateRawSync(data).toString("utf8");
  } catch {
    return null; // tampered, another secret, corrupted or from before compression
  }
}
