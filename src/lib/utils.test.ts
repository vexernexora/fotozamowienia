import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatDate,
  generateOrderNumber,
  calculateDpi,
  getQualityLevel,
  slugify,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
} from './utils'

describe('formatPrice', () => {
  it('formats price in PLN currency', () => {
    expect(formatPrice(99.99)).toContain('99,99')
    expect(formatPrice(99.99)).toContain('zl')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toContain('0,00')
  })

  it('handles large numbers', () => {
    expect(formatPrice(1234.56)).toContain('1')
  })
})

describe('generateOrderNumber', () => {
  it('generates order number with correct format', () => {
    const orderNumber = generateOrderNumber()
    expect(orderNumber).toMatch(/^ZAM-\d{6}-[A-Z0-9]{6}$/)
  })

  it('generates unique order numbers', () => {
    const numbers = new Set()
    for (let i = 0; i < 100; i++) {
      numbers.add(generateOrderNumber())
    }
    expect(numbers.size).toBe(100)
  })
})

describe('calculateDpi', () => {
  it('calculates DPI correctly for standard photo', () => {
    // 3000x2000 px image on 10x15 cm (100x150 mm)
    const result = calculateDpi(3000, 2000, 100, 150)
    expect(result.widthDpi).toBeGreaterThan(700)
    expect(result.heightDpi).toBeGreaterThan(300)
  })

  it('returns effective DPI as minimum of width and height DPI', () => {
    const result = calculateDpi(3000, 2000, 100, 150)
    expect(result.effectiveDpi).toBe(Math.min(result.widthDpi, result.heightDpi))
  })
})

describe('getQualityLevel', () => {
  it('returns excellent for high DPI', () => {
    const result = getQualityLevel(300, 150, 300)
    expect(result.level).toBe('excellent')
  })

  it('returns good for acceptable DPI', () => {
    const result = getQualityLevel(200, 150, 300)
    expect(result.level).toBe('good')
  })

  it('returns warning for low DPI', () => {
    const result = getQualityLevel(120, 150, 300)
    expect(result.level).toBe('warning')
  })

  it('returns poor for very low DPI', () => {
    const result = getQualityLevel(80, 150, 300)
    expect(result.level).toBe('poor')
  })
})

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Zdjecia Fotograficzne')).toBe('zdjecia-fotograficzne')
  })

  it('handles special characters', () => {
    expect(slugify('Test!@#$%^&*()')).toBe('test')
  })

  it('handles multiple spaces', () => {
    expect(slugify('Hello   World')).toBe('hello-world')
  })
})

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('validates Polish phone numbers', () => {
    expect(isValidPhone('123456789')).toBe(true)
    expect(isValidPhone('+48123456789')).toBe(true)
    expect(isValidPhone('123 456 789')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(isValidPhone('12345')).toBe(false)
    expect(isValidPhone('abcdefghi')).toBe(false)
  })
})

describe('isValidPostalCode', () => {
  it('validates Polish postal codes', () => {
    expect(isValidPostalCode('00-001')).toBe(true)
    expect(isValidPostalCode('12-345')).toBe(true)
  })

  it('rejects invalid postal codes', () => {
    expect(isValidPostalCode('12345')).toBe(false)
    expect(isValidPostalCode('1-234')).toBe(false)
    expect(isValidPostalCode('123-45')).toBe(false)
  })
})
