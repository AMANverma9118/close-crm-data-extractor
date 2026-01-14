import { nanoid } from 'nanoid'

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const numeric = parseFloat(
    value.replace(/[^0-9.,-]/g, '').replace(',', '.'),
  )
  return Number.isFinite(numeric) ? numeric : null
}

export function toDateString(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function ensureId(seed?: string | null): string {
  const cleaned = normalizeText(seed ?? '')
  if (cleaned) return hashString(cleaned)
  return nanoid()
}

export function hashString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return `id_${Math.abs(hash)}`
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

