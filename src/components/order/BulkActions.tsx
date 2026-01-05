'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatPrice } from '@/lib/utils'
import { CheckSquare, Square, Settings, Copy } from 'lucide-react'

interface Product {
  id: string
  name: string
  formats: {
    id: string
    basePrice: number
    format: {
      id: string
      name: string
      widthMm: number
      heightMm: number
    }
  }[]
}

interface PaperType {
  id: string
  name: string
  surcharge: number
}

interface FinishType {
  id: string
  name: string
  surcharge: number
}

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  products: Product[]
  paperTypes: PaperType[]
  finishTypes: FinishType[]
  onSelectAll: () => void
  onDeselectAll: () => void
  onApplySettings: (settings: {
    productId?: string
    formatId?: string
    paperTypeId?: string
    finishTypeId?: string
    cropMode?: 'fit' | 'fill'
    copies?: number
  }) => void
}

export function BulkActions({
  selectedCount,
  totalCount,
  products,
  paperTypes,
  finishTypes,
  onSelectAll,
  onDeselectAll,
  onApplySettings,
}: BulkActionsProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<string>('')

  const currentProduct = products.find((p) => p.id === selectedProduct)

  const handleApplyProduct = () => {
    if (selectedProduct && selectedFormat) {
      onApplySettings({ productId: selectedProduct, formatId: selectedFormat })
    }
  }

  return (
    <Card>
      <CardContent className="py-3 flex flex-wrap items-center gap-4">
        {/* Selection controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          >
            {selectedCount === totalCount ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Odznacz wszystkie
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Zaznacz wszystkie
              </>
            )}
          </Button>
          <Badge variant="secondary">
            {selectedCount} / {totalCount} zaznaczonych
          </Badge>
        </div>

        {selectedCount > 0 && (
          <>
            <div className="h-6 w-px bg-border" />

            {/* Bulk format change */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Zmien format dla zaznaczonych
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Produkt</label>
                  <Select
                    value={selectedProduct}
                    onValueChange={(value) => {
                      setSelectedProduct(value)
                      setSelectedFormat('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz produkt" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentProduct && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={selectedFormat}
                      onValueChange={setSelectedFormat}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz format" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentProduct.formats.map((pf) => (
                          <SelectItem key={pf.id} value={pf.id}>
                            {pf.format.name} - {formatPrice(pf.basePrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleApplyProduct}
                  disabled={!selectedProduct || !selectedFormat}
                  className="w-full"
                >
                  Zastosuj do {selectedCount} zdjec
                </Button>
              </PopoverContent>
            </Popover>

            {/* Paper type change */}
            <Select
              onValueChange={(value) => onApplySettings({ paperTypeId: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zmien papier" />
              </SelectTrigger>
              <SelectContent>
                {paperTypes.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Finish type change */}
            <Select
              onValueChange={(value) => onApplySettings({ finishTypeId: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zmien wykonczenie" />
              </SelectTrigger>
              <SelectContent>
                {finishTypes.map((finish) => (
                  <SelectItem key={finish.id} value={finish.id}>
                    {finish.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Crop mode change */}
            <Select
              onValueChange={(value: 'fit' | 'fill') =>
                onApplySettings({ cropMode: value })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kadrowanie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fit">Dopasuj</SelectItem>
                <SelectItem value="fill">Wypelnij</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </CardContent>
    </Card>
  )
}
