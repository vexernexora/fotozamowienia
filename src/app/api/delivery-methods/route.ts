import { NextResponse } from 'next/server'
import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tenant = await getTenantByHost()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const deliveryMethods = await db.deliveryMethod.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        price: true,
        freeThreshold: true,
        estimatedDays: true,
        pickupAddress: true,
        pickupHours: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(deliveryMethods)
  } catch (error) {
    console.error('Error fetching delivery methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery methods' },
      { status: 500 }
    )
  }
}
