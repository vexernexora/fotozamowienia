import { NextRequest, NextResponse } from 'next/server'
import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantByHost()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        customerName: true,
        customerEmail: true,
        subtotalNet: true,
        deliveryPrice: true,
        discountAmount: true,
        vatAmount: true,
        totalGross: true,
        createdAt: true,
        shippingName: true,
        shippingStreet: true,
        shippingCity: true,
        shippingPostalCode: true,
        shippingCountry: true,
        trackingNumber: true,
        deliveryMethod: {
          select: { name: true },
        },
        items: {
          select: {
            id: true,
            product: {
              select: { name: true },
            },
            photos: {
              select: {
                id: true,
                originalName: true,
                copies: true,
                totalPriceNet: true,
                productFormat: {
                  select: {
                    format: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
