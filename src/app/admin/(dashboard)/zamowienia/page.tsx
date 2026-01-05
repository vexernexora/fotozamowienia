import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Search, Download, Eye, Package } from 'lucide-react'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  NEW: 'info',
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

async function getOrders(tenantId: string, params: PageProps['searchParams']) {
  const status = typeof params.status === 'string' ? params.status : undefined
  const search = typeof params.search === 'string' ? params.search : undefined
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const perPage = 20

  const where = {
    tenantId,
    ...(status && status !== 'all' && { status: status as any }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' as const } },
        { customerEmail: { contains: search, mode: 'insensitive' as const } },
        { customerName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        customer: { select: { name: true, email: true } },
        deliveryMethod: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
  ])

  return { orders, total, page, perPage }
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const { orders, total, page, perPage } = await getOrders(
    session.user.tenantId,
    searchParams
  )

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zamowienia</h1>
          <p className="text-muted-foreground">
            Zarzadzaj zamowieniami klientow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksportuj CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Szukaj po numerze, email, nazwie..."
                  defaultValue={searchParams.search as string}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              name="status"
              defaultValue={(searchParams.status as string) || 'all'}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Filtruj</Button>
          </form>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Pozycje</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dostawa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Brak zamowien
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order._count.items} poz.
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.totalGross)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[order.status] || 'default'}
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.deliveryMethod?.name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/zamowienia/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pokazano {(page - 1) * perPage + 1} -{' '}
            {Math.min(page * perPage, total)} z {total} zamowien
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/zamowienia?page=${page - 1}`}>
                <Button variant="outline" size="sm">
                  Poprzednia
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/zamowienia?page=${page + 1}`}>
                <Button variant="outline" size="sm">
                  Nastepna
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
