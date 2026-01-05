import { NextRequest, NextResponse } from 'next/server'
import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByHost()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const { customer, shipping, deliveryMethodId, discountCode, notes, photos } = data

    // Validate required fields
    if (!customer?.email || !customer?.name) {
      return NextResponse.json(
        { error: 'Dane klienta sa wymagane' },
        { status: 400 }
      )
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Zamowienie musi zawierac co najmniej jedno zdjecie' },
        { status: 400 }
      )
    }

    // Find or create customer
    let dbCustomer = await db.customer.findFirst({
      where: {
        email: customer.email,
        tenantId: tenant.id,
      },
    })

    if (!dbCustomer) {
      dbCustomer = await db.customer.create({
        data: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          tenantId: tenant.id,
          marketingConsent: data.marketingConsent || false,
        },
      })
    }

    // Get delivery method
    let deliveryMethod = null
    let deliveryPrice = 0
    if (deliveryMethodId) {
      deliveryMethod = await db.deliveryMethod.findUnique({
        where: { id: deliveryMethodId },
      })
      if (deliveryMethod) {
        deliveryPrice = deliveryMethod.price
      }
    }

    // Calculate totals
    let subtotalNet = 0
    for (const photo of photos) {
      subtotalNet += photo.totalPrice || 0
    }

    // Apply discount
    let discountAmount = 0
    let discountCodeRecord = null
    if (discountCode) {
      discountCodeRecord = await db.discountCode.findFirst({
        where: {
          tenantId: tenant.id,
          code: discountCode.toUpperCase(),
          isActive: true,
        },
      })

      if (discountCodeRecord) {
        if (discountCodeRecord.discountType === 'PERCENTAGE') {
          discountAmount = subtotalNet * (discountCodeRecord.discountValue / 100)
        } else if (discountCodeRecord.discountType === 'FIXED') {
          discountAmount = Math.min(discountCodeRecord.discountValue, subtotalNet)
        } else if (discountCodeRecord.discountType === 'FREE_SHIPPING') {
          deliveryPrice = 0
        }

        // Increment usage
        await db.discountCode.update({
          where: { id: discountCodeRecord.id },
          data: { usedCount: { increment: 1 } },
        })
      }
    }

    // Check free delivery threshold
    if (deliveryMethod?.freeThreshold && subtotalNet >= deliveryMethod.freeThreshold) {
      deliveryPrice = 0
    }

    const netAmount = subtotalNet - discountAmount + deliveryPrice
    const vatRate = tenant.settings?.vatRate || 23
    const vatAmount = netAmount * (vatRate / 100)
    const totalGross = netAmount + vatAmount

    // Create order
    const orderNumber = generateOrderNumber()

    const order = await db.order.create({
      data: {
        orderNumber,
        tenantId: tenant.id,
        customerId: dbCustomer.id,
        status: 'NEW',

        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone,

        shippingName: shipping?.name || customer.name,
        shippingStreet: shipping?.street,
        shippingCity: shipping?.city,
        shippingPostalCode: shipping?.postalCode,
        shippingCountry: shipping?.country || 'Polska',
        shippingPhone: shipping?.phone || customer.phone,

        deliveryMethodId: deliveryMethod?.id,
        deliveryPrice,

        discountCodeId: discountCodeRecord?.id,
        discountAmount,

        subtotalNet,
        vatAmount,
        totalGross,

        paymentMethod: 'online',
        paymentStatus: 'PENDING',

        customerNotes: notes,

        items: {
          create: [
            {
              productId: photos[0].productId, // Simplified - group by product in real impl
              quantity: 1,
              unitPriceNet: subtotalNet,
              totalPriceNet: subtotalNet,
              photos: {
                create: photos.map((photo: any, index: number) => ({
                  originalPath: photo.originalPath || `pending/${orderNumber}/${index}`,
                  originalName: photo.originalName,
                  fileSize: photo.fileSize || 0,
                  mimeType: photo.mimeType || 'image/jpeg',
                  widthPx: photo.widthPx || 0,
                  heightPx: photo.heightPx || 0,
                  productFormatId: photo.formatId,
                  paperTypeId: photo.paperTypeId,
                  finishTypeId: photo.finishTypeId,
                  cropMode: photo.cropMode || 'fit',
                  rotation: photo.rotation || 0,
                  borderMm: photo.borderMm || 0,
                  copies: photo.copies || 1,
                  effectiveDpi: photo.effectiveDpi,
                  qualityWarning: photo.qualityMessage,
                  unitPriceNet: photo.unitPrice || 0,
                  totalPriceNet: photo.totalPrice || 0,
                  processingStatus: 'pending',
                  sortOrder: index,
                })),
              },
            },
          ],
        },

        statusHistory: {
          create: {
            status: 'NEW',
            note: 'Zamowienie utworzone',
            createdBy: 'system',
          },
        },
      },
      include: {
        items: {
          include: {
            photos: true,
          },
        },
      },
    })

    // TODO: Send confirmation email
    // TODO: Add to processing queue

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      total: totalGross,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Nie udalo sie utworzyc zamowienia' },
      { status: 500 }
    )
  }
}
