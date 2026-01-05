import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, note } = await request.json()

    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    })

    // Create status history entry
    await db.orderStatusHistory.create({
      data: {
        orderId: params.id,
        status,
        note,
        createdBy: session.user.name,
      },
    })

    // TODO: Send email notification based on status change

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
