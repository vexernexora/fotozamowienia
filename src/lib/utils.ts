import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number,
  options: {
    currency?: string
    showCurrency?: boolean
    locale?: string
  } = {}
): string {
  const { currency = 'PLN', showCurrency = true, locale = 'pl-PL' } = options

  const formatted = new Intl.NumberFormat(locale, {
    style: showCurrency ? 'currency' : 'decimal',
    currency: showCurrency ? currency : undefined,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)

  return formatted
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ZAM-${year}${month}${day}-${random}`
}

export function calculateDpi(
  widthPx: number,
  heightPx: number,
  widthMm: number,
  heightMm: number
): { widthDpi: number; heightDpi: number; effectiveDpi: number } {
  const mmToInch = 25.4
  const widthInch = widthMm / mmToInch
  const heightInch = heightMm / mmToInch

  const widthDpi = Math.round(widthPx / widthInch)
  const heightDpi = Math.round(heightPx / heightInch)
  const effectiveDpi = Math.min(widthDpi, heightDpi)

  return { widthDpi, heightDpi, effectiveDpi }
}

export function getQualityLevel(dpi: number, minDpi: number, recommendedDpi: number): {
  level: 'excellent' | 'good' | 'warning' | 'poor'
  message: string
} {
  if (dpi >= recommendedDpi) {
    return { level: 'excellent', message: 'Doskonala jakosc wydruku' }
  }
  if (dpi >= minDpi) {
    return { level: 'good', message: 'Dobra jakosc wydruku' }
  }
  if (dpi >= minDpi * 0.75) {
    return { level: 'warning', message: 'Obnizona jakosc wydruku' }
  }
  return { level: 'poor', message: 'Niska jakosc - zalecamy mniejszy format' }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024)
}

export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function isValidPostalCode(code: string): boolean {
  const postalRegex = /^\d{2}-\d{3}$/
  return postalRegex.test(code)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
