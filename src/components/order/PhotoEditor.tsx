'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { formatPrice, calculateDpi, getQualityLevel } from '@/lib/utils'
import { X, RotateCw, Maximize, Minimize, Plus, Minus } from 'lucide-react'

interface Photo {
  id: string
  file: File
  previewUrl: string
  widthPx: number
  heightPx: number
  settings: {
    productId: string
    formatId: string
    paperTypeId: string
    finishTypeId: string
    cropMode: 'fit' | 'fill'
    borderMm: number
    copies: number
    rotation: number
  }
}

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
      minDpi: number
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

interface Settings {
  minDpi: number
  recommendedDpi: number
  showQualityWarnings: boolean
}

interface PhotoEditorProps {
  photo: Photo
  products: Product[]
  paperTypes: PaperType[]
  finishTypes: FinishType[]
  settings: Settings
  onUpdate: (updates: Partial<Photo['settings']>) => void
  onClose: () => void
  calculatePrice: () => number
}

const qualityColors = {
  excellent: 'text-green-600 bg-green-50',
  good: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  poor: 'text-red-600 bg-red-50',
}

export function PhotoEditor({
  photo,
  products,
  paperTypes,
  finishTypes,
  settings,
  onUpdate,
  onClose,
  calculatePrice,
}: PhotoEditorProps) {
  const selectedProduct = products.find((p) => p.id === photo.settings.productId)
  const selectedFormat = selectedProduct?.formats.find(
    (f) => f.id === photo.settings.formatId
  )

  const getQuality = () => {
    if (!selectedFormat) return null

    const { effectiveDpi } = calculateDpi(
      photo.widthPx,
      photo.heightPx,
      selectedFormat.format.widthMm,
      selectedFormat.format.heightMm
    )

    return {
      dpi: effectiveDpi,
      ...getQualityLevel(effectiveDpi, settings.minDpi, settings.recommendedDpi),
    }
  }

  const quality = getQuality()
  const price = calculatePrice()

  const handleRotate = () => {
    onUpdate({ rotation: (photo.settings.rotation + 90) % 360 })
  }

  const handleCopiesChange = (delta: number) => {
    const newCopies = Math.max(1, Math.min(999, photo.settings.copies + delta))
    onUpdate({ copies: newCopies })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edycja zdjecia</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
          <img
            src={photo.previewUrl}
            alt={photo.file.name}
            className="w-full h-full object-contain"
            style={{ transform: `rotate(${photo.settings.rotation}deg)` }}
          />

          {/* Quality badge */}
          {quality && (
            <div className="absolute top-2 right-2">
              <Badge className={qualityColors[quality.level]}>
                {quality.dpi} DPI - {quality.message}
              </Badge>
            </div>
          )}
        </div>

        {/* File info */}
        <div className="text-xs text-muted-foreground">
          <p className="truncate">{photo.file.name}</p>
          <p>
            {photo.widthPx} x {photo.heightPx} px
          </p>
        </div>

        <Separator />

        {/* Product selection */}
        <div className="space-y-2">
          <Label>Produkt</Label>
          <Select
            value={photo.settings.productId}
            onValueChange={(value) => {
              const product = products.find((p) => p.id === value)
              onUpdate({
                productId: value,
                formatId: product?.formats[0]?.id || '',
              })
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

        {/* Format selection */}
        {selectedProduct && (
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={photo.settings.formatId}
              onValueChange={(value) => onUpdate({ formatId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz format" />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct.formats.map((pf) => (
                  <SelectItem key={pf.id} value={pf.id}>
                    {pf.format.name} ({pf.format.widthMm}x{pf.format.heightMm}mm) -{' '}
                    {formatPrice(pf.basePrice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Paper type */}
        <div className="space-y-2">
          <Label>Papier</Label>
          <Select
            value={photo.settings.paperTypeId}
            onValueChange={(value) => onUpdate({ paperTypeId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz papier" />
            </SelectTrigger>
            <SelectContent>
              {paperTypes.map((paper) => (
                <SelectItem key={paper.id} value={paper.id}>
                  {paper.name}
                  {paper.surcharge > 0 && ` (+${formatPrice(paper.surcharge)})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Finish type */}
        <div className="space-y-2">
          <Label>Wykonczenie</Label>
          <Select
            value={photo.settings.finishTypeId}
            onValueChange={(value) => onUpdate({ finishTypeId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz wykonczenie" />
            </SelectTrigger>
            <SelectContent>
              {finishTypes.map((finish) => (
                <SelectItem key={finish.id} value={finish.id}>
                  {finish.name}
                  {finish.surcharge > 0 && ` (+${formatPrice(finish.surcharge)})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Crop mode */}
        <div className="space-y-2">
          <Label>Tryb kadrowania</Label>
          <RadioGroup
            value={photo.settings.cropMode}
            onValueChange={(value: 'fit' | 'fill') =>
              onUpdate({ cropMode: value })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fit" id="fit" />
              <Label htmlFor="fit" className="flex items-center gap-1 cursor-pointer">
                <Minimize className="h-4 w-4" />
                Dopasuj (cale zdjecie)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fill" id="fill" />
              <Label htmlFor="fill" className="flex items-center gap-1 cursor-pointer">
                <Maximize className="h-4 w-4" />
                Wypelnij (moze przyciac)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Border */}
        <div className="space-y-2">
          <Label>Biala ramka (mm)</Label>
          <Slider
            value={[photo.settings.borderMm]}
            onValueChange={([value]) => onUpdate({ borderMm: value })}
            min={0}
            max={10}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            {photo.settings.borderMm}mm
          </p>
        </div>

        {/* Rotation */}
        <div className="flex items-center justify-between">
          <Label>Obrot</Label>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4 mr-2" />
            Obroc 90
          </Button>
        </div>

        <Separator />

        {/* Copies */}
        <div className="space-y-2">
          <Label>Ilosc kopii</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopiesChange(-1)}
              disabled={photo.settings.copies <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={photo.settings.copies}
              onChange={(e) =>
                onUpdate({
                  copies: Math.max(1, Math.min(999, parseInt(e.target.value) || 1)),
                })
              }
              className="w-20 text-center"
              min={1}
              max={999}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopiesChange(1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Price */}
        <div className="flex items-center justify-between py-2">
          <span className="font-medium">Cena za to zdjecie:</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(price)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
