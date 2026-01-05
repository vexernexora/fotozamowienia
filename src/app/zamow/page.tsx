import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'
import { OrderCreator } from '@/components/order/OrderCreator'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

async function getOrderData(tenantId: string) {
  const [products, paperTypes, finishTypes, deliveryMethods] = await Promise.all([
    db.product.findMany({
      where: { tenantId, isActive: true },
      include: {
        formats: {
          where: { isActive: true },
          include: {
            format: true,
            pricingRules: {
              where: { isActive: true },
              orderBy: { minQuantity: 'asc' },
            },
          },
          orderBy: { format: { sortOrder: 'asc' } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    db.paperType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    db.finishType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    db.deliveryMethod.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return { products, paperTypes, finishTypes, deliveryMethods }
}

export default async function OrderPage() {
  const tenant = await getTenantByHost()

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Nie znaleziono sklepu</p>
      </div>
    )
  }

  const data = await getOrderData(tenant.id)
  const settings = tenant.settings

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/koszyk">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Koszyk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Zamow wydruk zdjec</h1>
          <p className="text-muted-foreground">
            Zaladuj zdjecia, wybierz format i opcje, a nastepnie dodaj do koszyka
          </p>
        </div>

        <OrderCreator
          products={data.products}
          paperTypes={data.paperTypes}
          finishTypes={data.finishTypes}
          deliveryMethods={data.deliveryMethods}
          settings={{
            maxUploadSizeMb: settings?.maxUploadSizeMb || 50,
            maxFilesPerOrder: settings?.maxFilesPerOrder || 100,
            allowedFileTypes: settings?.allowedFileTypes || 'image/jpeg,image/png,image/webp',
            defaultCropMode: (settings?.defaultCropMode || 'fit') as 'fit' | 'fill',
            showQualityWarnings: settings?.showQualityWarnings ?? true,
            minDpi: settings?.minDpi || 150,
            recommendedDpi: settings?.recommendedDpi || 300,
          }}
          tenantId={tenant.id}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            {settings?.companyName || 'FotoDruk'} - Profesjonalny wydruk zdjec online
          </p>
        </div>
      </footer>
    </div>
  )
}
