import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartPhoto {
  id: string
  file?: File
  originalPath?: string
  thumbnailUrl?: string
  previewUrl?: string
  originalName: string
  fileSize: number
  mimeType: string
  widthPx: number
  heightPx: number

  // Selected options
  productId: string
  productName: string
  formatId: string
  formatName: string
  paperTypeId?: string
  paperTypeName?: string
  finishTypeId?: string
  finishTypeName?: string

  // Cropping
  cropMode: 'fit' | 'fill'
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  rotation: number

  // Options
  borderMm: number
  copies: number

  // Quality
  effectiveDpi?: number
  qualityLevel?: 'excellent' | 'good' | 'warning' | 'poor'
  qualityMessage?: string

  // Price
  unitPrice: number
  totalPrice: number
}

export interface CartState {
  photos: CartPhoto[]
  discountCode: string | null
  discountAmount: number
  discountType: 'percentage' | 'fixed' | 'free_shipping' | null
  deliveryMethodId: string | null
  deliveryPrice: number
  isExpress: boolean
  expressCharge: number

  // Calculated
  subtotal: number
  vatAmount: number
  total: number

  // Actions
  addPhoto: (photo: CartPhoto) => void
  updatePhoto: (id: string, updates: Partial<CartPhoto>) => void
  removePhoto: (id: string) => void
  clearCart: () => void
  duplicatePhoto: (id: string) => void

  setDiscountCode: (code: string | null, amount: number, type: 'percentage' | 'fixed' | 'free_shipping' | null) => void
  setDeliveryMethod: (id: string | null, price: number) => void
  setExpress: (isExpress: boolean, charge: number) => void

  applyBulkUpdate: (photoIds: string[], updates: Partial<CartPhoto>) => void

  recalculateTotals: () => void
}

const calculateTotals = (state: CartState) => {
  const subtotal = state.photos.reduce((sum, p) => sum + p.totalPrice, 0)

  let discountAmount = 0
  if (state.discountType === 'percentage') {
    discountAmount = subtotal * (state.discountAmount / 100)
  } else if (state.discountType === 'fixed') {
    discountAmount = Math.min(state.discountAmount, subtotal)
  }

  let deliveryPrice = state.deliveryPrice
  if (state.discountType === 'free_shipping') {
    deliveryPrice = 0
  }

  const expressCharge = state.isExpress ? state.expressCharge : 0
  const netAmount = subtotal - discountAmount + deliveryPrice + expressCharge
  const vatRate = 0.23
  const vatAmount = netAmount * vatRate
  const total = netAmount + vatAmount

  return {
    subtotal,
    discountAmount,
    vatAmount,
    total,
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      photos: [],
      discountCode: null,
      discountAmount: 0,
      discountType: null,
      deliveryMethodId: null,
      deliveryPrice: 0,
      isExpress: false,
      expressCharge: 0,
      subtotal: 0,
      vatAmount: 0,
      total: 0,

      addPhoto: (photo) => {
        set((state) => {
          const newState = { ...state, photos: [...state.photos, photo] }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      updatePhoto: (id, updates) => {
        set((state) => {
          const newPhotos = state.photos.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
          const newState = { ...state, photos: newPhotos }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      removePhoto: (id) => {
        set((state) => {
          const newPhotos = state.photos.filter((p) => p.id !== id)
          const newState = { ...state, photos: newPhotos }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      clearCart: () => {
        set({
          photos: [],
          discountCode: null,
          discountAmount: 0,
          discountType: null,
          deliveryMethodId: null,
          deliveryPrice: 0,
          isExpress: false,
          expressCharge: 0,
          subtotal: 0,
          vatAmount: 0,
          total: 0,
        })
      },

      duplicatePhoto: (id) => {
        const photo = get().photos.find((p) => p.id === id)
        if (photo) {
          const newPhoto = {
            ...photo,
            id: `${photo.id}-${Date.now()}`,
          }
          get().addPhoto(newPhoto)
        }
      },

      setDiscountCode: (code, amount, type) => {
        set((state) => {
          const newState = {
            ...state,
            discountCode: code,
            discountAmount: amount,
            discountType: type,
          }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      setDeliveryMethod: (id, price) => {
        set((state) => {
          const newState = {
            ...state,
            deliveryMethodId: id,
            deliveryPrice: price,
          }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      setExpress: (isExpress, charge) => {
        set((state) => {
          const newState = {
            ...state,
            isExpress,
            expressCharge: charge,
          }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      applyBulkUpdate: (photoIds, updates) => {
        set((state) => {
          const newPhotos = state.photos.map((p) =>
            photoIds.includes(p.id) ? { ...p, ...updates } : p
          )
          const newState = { ...state, photos: newPhotos }
          const totals = calculateTotals(newState)
          return { ...newState, ...totals }
        })
      },

      recalculateTotals: () => {
        set((state) => {
          const totals = calculateTotals(state)
          return { ...state, ...totals }
        })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        photos: state.photos.map(p => ({ ...p, file: undefined })),
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        discountType: state.discountType,
        deliveryMethodId: state.deliveryMethodId,
        deliveryPrice: state.deliveryPrice,
        isExpress: state.isExpress,
        expressCharge: state.expressCharge,
      }),
    }
  )
)
