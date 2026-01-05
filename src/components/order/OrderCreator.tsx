'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useCartStore, CartPhoto } from '@/store/cart'
import { PhotoEditor } from './PhotoEditor'
import { PhotoGrid } from './PhotoGrid'
import { BulkActions } from './BulkActions'
import { calculateDpi, getQualityLevel, formatPrice } from '@/lib/utils'
import {
  Upload,
  Image as ImageIcon,
  ShoppingCart,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  type: string
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
    pricingRules: {
      id: string
      minQuantity: number
      maxQuantity: number | null
      pricePerUnit: number | null
      discountPercent: number | null
    }[]
  }[]
}

interface PaperType {
  id: string
  name: string
  surcharge: number
  surchargeType: string
  isDefault: boolean
}

interface FinishType {
  id: string
  name: string
  surcharge: number
  surchargeType: string
  isDefault: boolean
}

interface DeliveryMethod {
  id: string
  name: string
  price: number
  freeThreshold: number | null
}

interface Settings {
  maxUploadSizeMb: number
  maxFilesPerOrder: number
  allowedFileTypes: string
  defaultCropMode: 'fit' | 'fill'
  showQualityWarnings: boolean
  minDpi: number
  recommendedDpi: number
}

interface OrderCreatorProps {
  products: Product[]
  paperTypes: PaperType[]
  finishTypes: FinishType[]
  deliveryMethods: DeliveryMethod[]
  settings: Settings
  tenantId: string
}

interface UploadedPhoto {
  id: string
  file: File
  previewUrl: string
  widthPx: number
  heightPx: number
  isSelected: boolean
  isProcessing: boolean
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

export function OrderCreator({
  products,
  paperTypes,
  finishTypes,
  deliveryMethods,
  settings,
  tenantId,
}: OrderCreatorProps) {
  const { toast } = useToast()
  const addPhoto = useCartStore((state) => state.addPhoto)
  const cartPhotos = useCartStore((state) => state.photos)

  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const defaultProduct = products[0]
  const defaultFormat = defaultProduct?.formats[0]
  const defaultPaper = paperTypes.find((p) => p.isDefault) || paperTypes[0]
  const defaultFinish = finishTypes.find((f) => f.isDefault) || finishTypes[0]

  const allowedTypes = settings.allowedFileTypes.split(',')
  const maxSizeBytes = settings.maxUploadSizeMb * 1024 * 1024

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (photos.length + acceptedFiles.length > settings.maxFilesPerOrder) {
        toast({
          title: 'Za duzo plikow',
          description: `Maksymalna liczba plikow to ${settings.maxFilesPerOrder}`,
          variant: 'destructive',
        })
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      const newPhotos: UploadedPhoto[] = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]

        if (file.size > maxSizeBytes) {
          toast({
            title: 'Plik za duzy',
            description: `${file.name} przekracza limit ${settings.maxUploadSizeMb}MB`,
            variant: 'destructive',
          })
          continue
        }

        try {
          const dimensions = await getImageDimensions(file)
          const previewUrl = URL.createObjectURL(file)

          newPhotos.push({
            id: uuidv4(),
            file,
            previewUrl,
            widthPx: dimensions.width,
            heightPx: dimensions.height,
            isSelected: false,
            isProcessing: false,
            settings: {
              productId: defaultProduct?.id || '',
              formatId: defaultFormat?.id || '',
              paperTypeId: defaultPaper?.id || '',
              finishTypeId: defaultFinish?.id || '',
              cropMode: settings.defaultCropMode,
              borderMm: 0,
              copies: 1,
              rotation: 0,
            },
          })
        } catch (error) {
          toast({
            title: 'Blad wczytywania',
            description: `Nie udalo sie wczytac ${file.name}`,
            variant: 'destructive',
          })
        }

        setUploadProgress(((i + 1) / acceptedFiles.length) * 100)
      }

      setPhotos((prev) => [...prev, ...newPhotos])
      setIsUploading(false)
      setUploadProgress(0)

      if (newPhotos.length > 0) {
        toast({
          title: 'Zdjecia zaladowane',
          description: `Dodano ${newPhotos.length} zdjec`,
        })
      }
    },
    [photos.length, settings, maxSizeBytes, defaultProduct, defaultFormat, defaultPaper, defaultFinish, toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes.map((t) => t.replace('image/', '.')),
    },
    maxSize: maxSizeBytes,
    multiple: true,
  })

  const updatePhotoSettings = (id: string, updates: Partial<UploadedPhoto['settings']>) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, settings: { ...p.settings, ...updates } } : p
      )
    )
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl)
      }
      return prev.filter((p) => p.id !== id)
    })
    if (selectedPhotoId === id) {
      setSelectedPhotoId(null)
    }
  }

  const togglePhotoSelection = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSelected: !p.isSelected } : p))
    )
  }

  const selectAllPhotos = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isSelected: true })))
  }

  const deselectAllPhotos = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isSelected: false })))
  }

  const applyBulkSettings = (updates: Partial<UploadedPhoto['settings']>) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.isSelected ? { ...p, settings: { ...p.settings, ...updates } } : p
      )
    )
  }

  const calculatePhotoPrice = (photo: UploadedPhoto): number => {
    const product = products.find((p) => p.id === photo.settings.productId)
    const productFormat = product?.formats.find((f) => f.id === photo.settings.formatId)

    if (!productFormat) return 0

    let price = productFormat.basePrice

    // Apply pricing rules based on quantity
    const rule = productFormat.pricingRules.find(
      (r) =>
        photo.settings.copies >= r.minQuantity &&
        (r.maxQuantity === null || photo.settings.copies <= r.maxQuantity)
    )

    if (rule) {
      if (rule.pricePerUnit !== null) {
        price = rule.pricePerUnit
      } else if (rule.discountPercent !== null) {
        price = price * (1 - rule.discountPercent / 100)
      }
    }

    // Apply paper surcharge
    const paper = paperTypes.find((p) => p.id === photo.settings.paperTypeId)
    if (paper && paper.surcharge > 0) {
      if (paper.surchargeType === 'percentage') {
        price += price * (paper.surcharge / 100)
      } else {
        price += paper.surcharge
      }
    }

    // Apply finish surcharge
    const finish = finishTypes.find((f) => f.id === photo.settings.finishTypeId)
    if (finish && finish.surcharge > 0) {
      if (finish.surchargeType === 'percentage') {
        price += price * (finish.surcharge / 100)
      } else {
        price += finish.surcharge
      }
    }

    return price * photo.settings.copies
  }

  const addToCart = async () => {
    if (photos.length === 0) {
      toast({
        title: 'Brak zdjec',
        description: 'Zaladuj zdjecia przed dodaniem do koszyka',
        variant: 'destructive',
      })
      return
    }

    for (const photo of photos) {
      const product = products.find((p) => p.id === photo.settings.productId)
      const productFormat = product?.formats.find((f) => f.id === photo.settings.formatId)
      const paper = paperTypes.find((p) => p.id === photo.settings.paperTypeId)
      const finish = finishTypes.find((f) => f.id === photo.settings.finishTypeId)

      if (!product || !productFormat) continue

      const { effectiveDpi } = calculateDpi(
        photo.widthPx,
        photo.heightPx,
        productFormat.format.widthMm,
        productFormat.format.heightMm
      )

      const quality = getQualityLevel(
        effectiveDpi,
        settings.minDpi,
        settings.recommendedDpi
      )

      const unitPrice = calculatePhotoPrice({ ...photo, settings: { ...photo.settings, copies: 1 } })
      const totalPrice = calculatePhotoPrice(photo)

      const cartPhoto: CartPhoto = {
        id: photo.id,
        file: photo.file,
        originalName: photo.file.name,
        fileSize: photo.file.size,
        mimeType: photo.file.type,
        widthPx: photo.widthPx,
        heightPx: photo.heightPx,
        productId: photo.settings.productId,
        productName: product.name,
        formatId: photo.settings.formatId,
        formatName: productFormat.format.name,
        paperTypeId: photo.settings.paperTypeId,
        paperTypeName: paper?.name,
        finishTypeId: photo.settings.finishTypeId,
        finishTypeName: finish?.name,
        cropMode: photo.settings.cropMode,
        rotation: photo.settings.rotation,
        borderMm: photo.settings.borderMm,
        copies: photo.settings.copies,
        effectiveDpi,
        qualityLevel: quality.level,
        qualityMessage: quality.message,
        unitPrice,
        totalPrice,
      }

      addPhoto(cartPhoto)
    }

    // Clean up preview URLs
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])

    toast({
      title: 'Dodano do koszyka',
      description: `Dodano ${photos.length} zdjec do koszyka`,
    })
  }

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId)
  const selectedCount = photos.filter((p) => p.isSelected).length
  const totalPrice = photos.reduce((sum, p) => sum + calculatePhotoPrice(p), 0)

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p>Ladowanie zdjec...</p>
                <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Przeciagnij i upusc zdjecia tutaj
                </p>
                <p className="text-muted-foreground mb-4">
                  lub kliknij, aby wybrac z dysku
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    Max {settings.maxUploadSizeMb}MB na plik
                  </Badge>
                  <Badge variant="outline">
                    Max {settings.maxFilesPerOrder} plikow
                  </Badge>
                  <Badge variant="outline">JPG, PNG, WebP</Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {photos.length > 0 && (
        <>
          {/* Bulk actions */}
          <BulkActions
            selectedCount={selectedCount}
            totalCount={photos.length}
            products={products}
            paperTypes={paperTypes}
            finishTypes={finishTypes}
            onSelectAll={selectAllPhotos}
            onDeselectAll={deselectAllPhotos}
            onApplySettings={applyBulkSettings}
          />

          {/* Photo grid and editor */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4">
                  <PhotoGrid
                    photos={photos}
                    products={products}
                    settings={settings}
                    onSelect={togglePhotoSelection}
                    onEdit={setSelectedPhotoId}
                    onRemove={removePhoto}
                    calculatePrice={calculatePhotoPrice}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Photo editor */}
              {selectedPhoto && (
                <PhotoEditor
                  photo={selectedPhoto}
                  products={products}
                  paperTypes={paperTypes}
                  finishTypes={finishTypes}
                  settings={settings}
                  onUpdate={(updates) =>
                    updatePhotoSettings(selectedPhoto.id, updates)
                  }
                  onClose={() => setSelectedPhotoId(null)}
                  calculatePrice={() => calculatePhotoPrice(selectedPhoto)}
                />
              )}

              {/* Summary */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Zdjecia ({photos.length})
                    </span>
                    <span className="font-bold text-lg">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cena netto. VAT 23% zostanie doliczony przy zamowieniu.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={addToCart}
                      className="flex-1"
                      disabled={photos.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Dodaj do koszyka
                    </Button>
                    {cartPhotos.length > 0 && (
                      <Link href="/koszyk">
                        <Button variant="outline">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {cartPhotos.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      W koszyku: {cartPhotos.length} zdjec
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
