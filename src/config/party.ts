export const DEFAULT_PARTY_PHONE_DIGITS = 11

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '').slice(0, DEFAULT_PARTY_PHONE_DIGITS)
}
