import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Edit, Eye, Package, Trash2 } from 'lucide-react'

const productTypeLabels: Record<string, string> = {
  PRINT: 'Odbitka',
  POSTER: 'Plakat',
  ALBUM: 'Fotoalbum',
  CANVAS: 'Obraz na plotnie',
  CALENDAR: 'Kalendarz',
  OTHER: 'Inne',
}

async function getProducts(tenantId: string) {
  return db.product.findMany({
    where: { tenantId },
    include: {
      formats: {
        include: { format: true },
        orderBy: { format: { sortOrder: 'asc' } },
      },
      _count: { select: { orderItems: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const products = await getProducts(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkty</h1>
          <p className="text-muted-foreground">
            Zarzadzaj produktami i ich wariantami
          </p>
        </div>
        <Link href="/admin/produkty/nowy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj produkt
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Formaty</TableHead>
                <TableHead>Cena od</TableHead>
                <TableHead>Zamowienia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Brak produktow. Dodaj pierwszy produkt.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const minPrice = product.formats.reduce(
                    (min, f) => (f.basePrice < min ? f.basePrice : min),
                    product.formats[0]?.basePrice || 0
                  )

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {productTypeLabels[product.type] || product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {product.formats.length} formatow
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.formats.length > 0
                          ? formatPrice(minPrice)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product._count.orderItems}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.isActive ? 'success' : 'secondary'}
                        >
                          {product.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/produkty/${product.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
