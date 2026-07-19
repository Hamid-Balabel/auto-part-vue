export function formatMoney(value: number | string | null | undefined, currency = 'USD'): string {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}
