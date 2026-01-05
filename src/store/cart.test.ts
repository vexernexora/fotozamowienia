import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, CartPhoto } from './cart'

const mockPhoto: CartPhoto = {
  id: 'photo-1',
  originalName: 'test.jpg',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  widthPx: 3000,
  heightPx: 2000,
  productId: 'product-1',
  productName: 'Odbitki',
  formatId: 'format-1',
  formatName: '10x15',
  cropMode: 'fit',
  rotation: 0,
  borderMm: 0,
  copies: 1,
  unitPrice: 0.59,
  totalPrice: 0.59,
}

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({
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
  })

  it('adds photo to cart', () => {
    const { addPhoto } = useCartStore.getState()
    addPhoto(mockPhoto)

    const state = useCartStore.getState()
    expect(state.photos).toHaveLength(1)
    expect(state.photos[0].id).toBe('photo-1')
  })

  it('calculates subtotal correctly', () => {
    const { addPhoto } = useCartStore.getState()
    addPhoto(mockPhoto)
    addPhoto({ ...mockPhoto, id: 'photo-2', totalPrice: 1.00 })

    const state = useCartStore.getState()
    expect(state.subtotal).toBe(1.59)
  })

  it('removes photo from cart', () => {
    const { addPhoto, removePhoto } = useCartStore.getState()
    addPhoto(mockPhoto)
    addPhoto({ ...mockPhoto, id: 'photo-2' })

    removePhoto('photo-1')

    const state = useCartStore.getState()
    expect(state.photos).toHaveLength(1)
    expect(state.photos[0].id).toBe('photo-2')
  })

  it('updates photo settings', () => {
    const { addPhoto, updatePhoto } = useCartStore.getState()
    addPhoto(mockPhoto)

    updatePhoto('photo-1', { copies: 5, totalPrice: 2.95 })

    const state = useCartStore.getState()
    expect(state.photos[0].copies).toBe(5)
    expect(state.subtotal).toBe(2.95)
  })

  it('clears cart', () => {
    const { addPhoto, clearCart } = useCartStore.getState()
    addPhoto(mockPhoto)
    addPhoto({ ...mockPhoto, id: 'photo-2' })

    clearCart()

    const state = useCartStore.getState()
    expect(state.photos).toHaveLength(0)
    expect(state.subtotal).toBe(0)
    expect(state.total).toBe(0)
  })

  it('applies percentage discount', () => {
    const { addPhoto, setDiscountCode } = useCartStore.getState()
    addPhoto({ ...mockPhoto, totalPrice: 100 })

    setDiscountCode('DISCOUNT10', 10, 'percentage')

    const state = useCartStore.getState()
    expect(state.discountCode).toBe('DISCOUNT10')
    expect(state.discountAmount).toBe(10)
  })

  it('sets delivery method', () => {
    const { addPhoto, setDeliveryMethod } = useCartStore.getState()
    addPhoto(mockPhoto)

    setDeliveryMethod('delivery-1', 14.99)

    const state = useCartStore.getState()
    expect(state.deliveryMethodId).toBe('delivery-1')
    expect(state.deliveryPrice).toBe(14.99)
  })

  it('applies bulk update to selected photos', () => {
    const { addPhoto, applyBulkUpdate } = useCartStore.getState()
    addPhoto(mockPhoto)
    addPhoto({ ...mockPhoto, id: 'photo-2' })
    addPhoto({ ...mockPhoto, id: 'photo-3' })

    applyBulkUpdate(['photo-1', 'photo-2'], { copies: 10 })

    const state = useCartStore.getState()
    expect(state.photos[0].copies).toBe(10)
    expect(state.photos[1].copies).toBe(10)
    expect(state.photos[2].copies).toBe(1) // Not updated
  })
})
