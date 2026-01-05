import { db } from '@/lib/db'
import { sendOrderStatusUpdate } from '@/lib/email'

export interface PaymentResult {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  error?: string
}

export interface PaymentProvider {
  name: string
  createPayment(orderId: string, amount: number, currency: string): Promise<PaymentResult>
  verifyPayment(transactionId: string): Promise<boolean>
  refundPayment(transactionId: string, amount: number): Promise<PaymentResult>
}

// Sandbox/Mock Payment Provider
export class SandboxPaymentProvider implements PaymentProvider {
  name = 'sandbox'

  async createPayment(
    orderId: string,
    amount: number,
    currency: string = 'PLN'
  ): Promise<PaymentResult> {
    const successRate = parseInt(process.env.PAYMENT_SANDBOX_SUCCESS_RATE || '100')
    const random = Math.random() * 100

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (random <= successRate) {
      const transactionId = `SANDBOX-${Date.now()}-${Math.random().toString(36).substring(7)}`

      // In sandbox mode, auto-confirm payment
      await this.confirmPayment(orderId, transactionId)

      return {
        success: true,
        transactionId,
        redirectUrl: `/zamowienie/${orderId}?payment=success`,
      }
    }

    return {
      success: false,
      error: 'Platnosc odrzucona (tryb sandbox)',
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    // In sandbox mode, all transactions are valid
    return transactionId.startsWith('SANDBOX-')
  }

  async refundPayment(
    transactionId: string,
    amount: number
  ): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      transactionId: `REFUND-${transactionId}`,
    }
  }

  private async confirmPayment(orderId: string, transactionId: string) {
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentId: transactionId,
        paidAt: new Date(),
        status: 'PAID',
      },
    })

    await db.orderStatusHistory.create({
      data: {
        orderId,
        status: 'PAID',
        note: 'Platnosc potwierdzona (sandbox)',
        createdBy: 'system',
      },
    })

    // Send email notification
    await sendOrderStatusUpdate(orderId, 'PAID')
  }
}

// Factory function to get payment provider
export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_MODE || 'sandbox'

  switch (mode) {
    case 'sandbox':
    default:
      return new SandboxPaymentProvider()
    // Add more providers here:
    // case 'stripe':
    //   return new StripePaymentProvider()
    // case 'przelewy24':
    //   return new Przelewy24PaymentProvider()
  }
}

// API helpers
export async function initiatePayment(orderId: string): Promise<PaymentResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { totalGross: true, paymentStatus: true },
  })

  if (!order) {
    return { success: false, error: 'Zamowienie nie istnieje' }
  }

  if (order.paymentStatus === 'COMPLETED') {
    return { success: false, error: 'Zamowienie jest juz oplacone' }
  }

  const provider = getPaymentProvider()
  return provider.createPayment(orderId, order.totalGross, 'PLN')
}

export async function processRefund(
  orderId: string,
  amount?: number
): Promise<PaymentResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentId: true, totalGross: true, paymentStatus: true },
  })

  if (!order || !order.paymentId) {
    return { success: false, error: 'Brak platnosci do zwrotu' }
  }

  if (order.paymentStatus !== 'COMPLETED') {
    return { success: false, error: 'Platnosc nie zostala zakonczona' }
  }

  const provider = getPaymentProvider()
  const refundAmount = amount || order.totalGross

  const result = await provider.refundPayment(order.paymentId, refundAmount)

  if (result.success) {
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    })

    await db.orderStatusHistory.create({
      data: {
        orderId,
        status: 'REFUNDED',
        note: `Zwrot platnosci: ${refundAmount.toFixed(2)} PLN`,
        createdBy: 'system',
      },
    })
  }

  return result
}
