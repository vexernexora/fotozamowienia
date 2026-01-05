import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Mail,
  Printer,
  Truck,
  User,
  Package,
  CreditCard,
  MapPin,
  Clock,
} from 'lucide-react'
import { OrderStatusUpdate } from '@/components/admin/OrderStatusUpdate'

interface PageProps {
  params: { id: string }
}

async function getOrder(id: string, tenantId: string) {
  const order = await db.order.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      deliveryMethod: true,
      discountCode: true,
      items: {
        include: {
          product: true,
          photos: {
            include: {
              productFormat: { include: { format: true } },
              paperType: true,
              finishType: true,
            },
          },
        },
      },
      notes: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return order
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

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Oczekuje',
  PROCESSING: 'W trakcie',
  COMPLETED: 'Zaplacone',
  FAILED: 'Nieudane',
  REFUNDED: 'Zwrocone',
  CANCELLED: 'Anulowane',
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const order = await getOrder(params.id, session.user.tenantId)

  if (!order) {
    notFound()
  }

  const totalPhotos = order.items.reduce(
    (sum, item) => sum + item.photos.reduce((s, p) => s + p.copies, 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/zamowienia">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Zamowienie {order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Utworzone {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Wyslij email
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Drukuj
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Pobierz pliki
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status update */}
          <OrderStatusUpdate
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pozycje zamowienia ({totalPhotos} szt.)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <span className="font-medium">
                      {formatPrice(item.totalPriceNet)}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {item.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {photo.thumbnailPath ? (
                            <img
                              src={`/api/files/${photo.thumbnailPath}`}
                              alt={photo.originalName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {photo.originalName}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {photo.productFormat && (
                              <Badge variant="outline">
                                {photo.productFormat.format.name}
                              </Badge>
                            )}
                            {photo.paperType && (
                              <Badge variant="outline">
                                {photo.paperType.name}
                              </Badge>
                            )}
                            {photo.finishType && (
                              <Badge variant="outline">
                                {photo.finishType.name}
                              </Badge>
                            )}
                            {photo.borderMm > 0 && (
                              <Badge variant="outline">
                                Ramka {photo.borderMm}mm
                              </Badge>
                            )}
                          </div>
                          {photo.qualityWarning && (
                            <p className="text-xs text-warning mt-1">
                              {photo.qualityWarning}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{photo.copies} szt.</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(photo.unitPriceNet)}/szt.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historia statusow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex items-start gap-4">
                    <div
                      className={`h-2 w-2 mt-2 rounded-full ${
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {statusLabels[history.status] || history.status}
                      </p>
                      {history.note && (
                        <p className="text-sm text-muted-foreground">
                          {history.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(history.createdAt)}
                        {history.createdBy && ` - ${history.createdBy}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produkty netto</span>
                <span>{formatPrice(order.subtotalNet)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Rabat</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              {order.isExpress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ekspres</span>
                  <span>{formatPrice(order.expressCharge)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dostawa</span>
                <span>{formatPrice(order.deliveryPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatPrice(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Razem brutto</span>
                <span>{formatPrice(order.totalGross)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Klient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">
                {order.customerEmail}
              </p>
              {order.customerPhone && (
                <p className="text-sm text-muted-foreground">
                  {order.customerPhone}
                </p>
              )}
              {order.customer && (
                <Link href={`/admin/klienci/${order.customer.id}`}>
                  <Button variant="link" className="p-0 h-auto">
                    Zobacz profil klienta
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Delivery address */}
          {order.shippingStreet && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adres dostawy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium">{order.shippingName}</p>
                <p className="text-sm">{order.shippingStreet}</p>
                <p className="text-sm">
                  {order.shippingPostalCode} {order.shippingCity}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingCountry}
                </p>
                {order.shippingPhone && (
                  <p className="text-sm text-muted-foreground">
                    Tel: {order.shippingPhone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Dostawa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">
                {order.deliveryMethod?.name || 'Brak'}
              </p>
              {order.trackingNumber && (
                <p className="text-sm">
                  Nr sledzenia: <code>{order.trackingNumber}</code>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Platnosc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status</span>
                <Badge
                  variant={
                    order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'
                  }
                >
                  {paymentStatusLabels[order.paymentStatus] ||
                    order.paymentStatus}
                </Badge>
              </div>
              {order.paymentMethod && (
                <p className="text-sm text-muted-foreground">
                  Metoda: {order.paymentMethod}
                </p>
              )}
              {order.paidAt && (
                <p className="text-sm text-muted-foreground">
                  Data platnosci: {formatDateTime(order.paidAt)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.customerNotes || order.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notatki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.customerNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Od klienta:
                    </p>
                    <p className="text-sm">{order.customerNotes}</p>
                  </div>
                )}
                {order.internalNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Wewnetrzne:
                    </p>
                    <p className="text-sm">{order.internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
