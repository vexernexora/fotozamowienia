import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/lib/payments'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const result = await initiatePayment(orderId)

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
