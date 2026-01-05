import { NextRequest, NextResponse } from 'next/server'
import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByHost()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const { code, orderValue } = await request.json()

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Kod jest wymagany' },
        { status: 400 }
      )
    }

    const discountCode = await db.discountCode.findFirst({
      where: {
        tenantId: tenant.id,
        code: code.toUpperCase(),
        isActive: true,
      },
    })

    if (!discountCode) {
      return NextResponse.json({
        valid: false,
        message: 'Kod rabatowy nie istnieje',
      })
    }

    // Check if expired
    if (discountCode.validTo && new Date() > discountCode.validTo) {
      return NextResponse.json({
        valid: false,
        message: 'Kod rabatowy wygasl',
      })
    }

    // Check if not yet valid
    if (new Date() < discountCode.validFrom) {
      return NextResponse.json({
        valid: false,
        message: 'Kod rabatowy nie jest jeszcze aktywny',
      })
    }

    // Check max uses
    if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'Kod rabatowy zostal juz wykorzystany maksymalna liczbe razy',
      })
    }

    // Check minimum order value
    if (discountCode.minOrderValue && orderValue < discountCode.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Minimalna wartosc zamowienia to ${discountCode.minOrderValue.toFixed(2)} zl`,
      })
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.discountType === 'PERCENTAGE') {
      discountAmount = orderValue * (discountCode.discountValue / 100)
    } else if (discountCode.discountType === 'FIXED') {
      discountAmount = Math.min(discountCode.discountValue, orderValue)
    }

    return NextResponse.json({
      valid: true,
      discountType: discountCode.discountType.toLowerCase(),
      discountValue: discountCode.discountValue,
      discountAmount,
      message: 'Kod rabatowy jest prawidlowy',
    })
  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { valid: false, message: 'Blad weryfikacji kodu' },
      { status: 500 }
    )
  }
}
