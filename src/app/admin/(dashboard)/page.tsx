import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardStats(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalCustomers,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    db.order.count({ where: { tenantId } }),
    db.order.count({
      where: { tenantId, createdAt: { gte: today } },
    }),
    db.order.count({
      where: {
        tenantId,
        status: { in: ['NEW', 'PAID', 'PROCESSING', 'PRINTING'] },
      },
    }),
    db.order.count({
      where: { tenantId, status: 'COMPLETED' },
    }),
    db.customer.count({ where: { tenantId } }),
    db.order.aggregate({
      where: { tenantId, paymentStatus: 'COMPLETED' },
      _sum: { totalGross: true },
    }),
    db.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ])

  return {
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalCustomers,
    totalRevenue: totalRevenue._sum.totalGross || 0,
    recentOrders,
  }
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  NEW: 'default',
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  PROCESSING: 'secondary',
  PRINTING: 'secondary',
  READY: 'success',
  SHIPPED: 'success',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
}

const statusLabels: Record<string, string> = {
  NEW: 'Nowe',
  PENDING_PAYMENT: 'Oczekuje na platnosc',
  PAID: 'Oplacone',
  PROCESSING: 'W realizacji',
  PRINTING: 'Drukowanie',
  READY: 'Gotowe',
  SHIPPED: 'Wyslane',
  DELIVERED: 'Dostarczone',
  COMPLETED: 'Zakonczone',
  CANCELLED: 'Anulowane',
  REFUNDED: 'Zwrocone',
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const stats = await getDashboardStats(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pulpit</h1>
        <p className="text-muted-foreground">
          Witaj, {session.user.name}. Oto podsumowanie Twojego sklepu.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Zamowienia dzisiaj
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              Lacznie: {stats.totalOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Do realizacji
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Oczekujace zamowienia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Klienci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Zarejestrowani klienci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Przychod</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Lacznie brutto</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending orders alert */}
      {stats.pendingOrders > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium">
                Masz {stats.pendingOrders} zamowien do realizacji
              </p>
              <p className="text-sm text-muted-foreground">
                Przejdz do listy zamowien, aby je przetworzyc
              </p>
            </div>
            <Link href="/admin/zamowienia?status=pending">
              <Badge variant="outline" className="cursor-pointer">
                Zobacz
              </Badge>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie zamowienia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Brak zamowien
              </p>
            ) : (
              stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/zamowienia/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.name || order.customerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(order.totalGross)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={statusColors[order.status] || 'default'}
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
