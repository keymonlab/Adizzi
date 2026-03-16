// Phone normalization is handled in contacts.ts
// HMAC hashing is server-side only (in Edge Functions)
// This file provides any client-side crypto utilities if needed

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
