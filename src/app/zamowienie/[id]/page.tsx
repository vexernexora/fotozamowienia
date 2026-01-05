'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { formatPrice, formatDateTime } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  CreditCard,
  ArrowLeft,
  Loader2,
  XCircle,
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  customerName: string
  customerEmail: string
  subtotalNet: number
  deliveryPrice: number
  discountAmount: number
  vatAmount: number
  totalGross: number
  createdAt: string
  shippingName: string
  shippingStreet: string
  shippingCity: string
  shippingPostalCode: string
  trackingNumber: string | null
  deliveryMethod: { name: string } | null
  items: {
    id: string
    product: { name: string }
    photos: {
      id: string
      originalName: string
      copies: number
      totalPriceNet: number
      productFormat: { format: { name: string } } | null
    }[]
  }[]
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  NEW: { label: 'Nowe', color: 'bg-blue-100 text-blue-800', icon: Clock },
  PENDING_PAYMENT: {
    label: 'Oczekuje na platnosc',
    color: 'bg-yellow-100 text-yellow-800',
    icon: CreditCard,
  },
  PAID: { label: 'Oplacone', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  PROCESSING: {
    label: 'W realizacji',
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
  },
  PRINTING: { label: 'Drukowanie', color: 'bg-purple-100 text-purple-800', icon: Package },
  READY: {
    label: 'Gotowe do wysylki',
    color: 'bg-green-100 text-green-800',
    icon: Package,
  },
  SHIPPED: { label: 'Wyslane', color: 'bg-blue-100 text-blue-800', icon: Truck },
  DELIVERED: {
    label: 'Dostarczone',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Zakonczone',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELLED: { label: 'Anulowane', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function OrderPage({ params }: PageProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const showPayment = searchParams.get('payment') === 'true'
  const paymentSuccess = searchParams.get('payment') === 'success'

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  useEffect(() => {
    if (paymentSuccess) {
      toast({
        title: 'Platnosc zakonczona',
        description: 'Twoje zamowienie zostalo oplacone',
      })
    }
  }, [paymentSuccess])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.id }),
      })

      const data = await res.json()

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        toast({
          title: 'Blad platnosci',
          description: data.error || 'Sprobuj ponownie',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie przetworzyc platnosci',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Zamowienie nie znalezione</h1>
        <Link href="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wrocna strone glowna
          </Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig.NEW
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success message */}
          {paymentSuccess && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-4 py-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="font-bold text-green-800">
                    Platnosc zakonczona pomyslnie
                  </h2>
                  <p className="text-green-700">
                    Dziekujemy za zamowienie. Przystepujemy do realizacji.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order header */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                  <p className="text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <Badge className={status.color}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment prompt */}
          {(showPayment || order.paymentStatus === 'PENDING') &&
            order.status !== 'CANCELLED' && (
              <Card className="border-primary">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">
                        Oczekuje na platnosc
                      </h2>
                      <p className="text-muted-foreground">
                        Kwota do zaplaty: {formatPrice(order.totalGross)}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <CreditCard className="h-4 w-4 mr-2" />
                      Zaplac teraz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Zamowione produkty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item) =>
                  item.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{photo.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {photo.productFormat?.format.name || item.product.name}
                          {photo.copies > 1 && ` x${photo.copies}`}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatPrice(photo.totalPriceNet)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Delivery info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Dostawa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{order.shippingName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingStreet}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingPostalCode} {order.shippingCity}
                  </p>
                </div>
                {order.deliveryMethod && (
                  <p className="text-sm">
                    Metoda: {order.deliveryMethod.name}
                  </p>
                )}
                {order.trackingNumber && (
                  <p className="text-sm">
                    Nr sledzenia: <code>{order.trackingNumber}</code>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dostawa</span>
                <span>{formatPrice(order.deliveryPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatPrice(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Razem brutto</span>
                <span className="text-primary">
                  {formatPrice(order.totalGross)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Back link */}
          <div className="text-center">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wrocna strone glowna
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
