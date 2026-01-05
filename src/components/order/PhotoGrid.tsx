'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatPrice, calculateDpi, getQualityLevel } from '@/lib/utils'
import { Edit, Trash2, Copy, AlertTriangle, Check } from 'lucide-react'

interface Photo {
  id: string
  file: File
  previewUrl: string
  widthPx: number
  heightPx: number
  isSelected: boolean
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

interface Settings {
  minDpi: number
  recommendedDpi: number
  showQualityWarnings: boolean
}

interface PhotoGridProps {
  photos: Photo[]
  products: Product[]
  settings: Settings
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  calculatePrice: (photo: Photo) => number
}

const qualityColors = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  poor: 'bg-red-100 text-red-800 border-red-200',
}

export function PhotoGrid({
  photos,
  products,
  settings,
  onSelect,
  onEdit,
  onRemove,
  calculatePrice,
}: PhotoGridProps) {
  const getPhotoInfo = (photo: Photo) => {
    const product = products.find((p) => p.id === photo.settings.productId)
    const format = product?.formats.find((f) => f.id === photo.settings.formatId)

    if (!format) return null

    const { effectiveDpi } = calculateDpi(
      photo.widthPx,
      photo.heightPx,
      format.format.widthMm,
      format.format.heightMm
    )

    const quality = getQualityLevel(
      effectiveDpi,
      settings.minDpi,
      settings.recommendedDpi
    )

    return {
      formatName: format.format.name,
      effectiveDpi,
      quality,
    }
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Zaladuj zdjecia, aby rozpoczac
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => {
        const info = getPhotoInfo(photo)
        const price = calculatePrice(photo)

        return (
          <div
            key={photo.id}
            className={`group relative rounded-lg border-2 overflow-hidden transition-all ${
              photo.isSelected
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-muted-foreground/30'
            }`}
          >
            {/* Thumbnail */}
            <div
              className="aspect-square bg-muted cursor-pointer relative"
              onClick={() => onEdit(photo.id)}
            >
              <img
                src={photo.previewUrl}
                alt={photo.file.name}
                className="w-full h-full object-cover"
                style={{ transform: `rotate(${photo.settings.rotation}deg)` }}
              />

              {/* Selection checkbox */}
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(photo.id)
                }}
              >
                <div
                  className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${
                    photo.isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-white/80 border-gray-300 hover:border-primary'
                  }`}
                >
                  {photo.isSelected && <Check className="h-4 w-4" />}
                </div>
              </div>

              {/* Quality indicator */}
              {settings.showQualityWarnings && info && (
                <div className="absolute top-2 right-2">
                  <Badge
                    className={`text-xs ${qualityColors[info.quality.level]}`}
                  >
                    {info.effectiveDpi} DPI
                  </Badge>
                </div>
              )}

              {/* Copies badge */}
              {photo.settings.copies > 1 && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    x{photo.settings.copies}
                  </Badge>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(photo.id)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(photo.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="p-2 bg-background">
              <p className="text-xs font-medium truncate" title={photo.file.name}>
                {photo.file.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {info?.formatName || 'Wybierz format'}
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(price)}
                </span>
              </div>
              {info?.quality.level === 'warning' ||
              info?.quality.level === 'poor' ? (
                <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{info.quality.message}</span>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
