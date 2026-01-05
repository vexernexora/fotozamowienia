'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Truck,
  CreditCard,
  Tag,
  Loader2,
  Package,
} from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment'>('cart')
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

  const {
    photos,
    removePhoto,
    clearCart,
    subtotal,
    discountAmount,
    discountCode,
    vatAmount,
    total,
    deliveryMethodId,
    deliveryPrice,
    setDeliveryMethod,
    setDiscountCode,
  } = useCartStore()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    notes: '',
    acceptTerms: false,
    marketingConsent: false,
  })

  const [deliveryMethods, setDeliveryMethods] = useState<
    Array<{
      id: string
      name: string
      price: number
      freeThreshold: number | null
      estimatedDays: string | null
    }>
  >([])

  useEffect(() => {
    // Fetch delivery methods
    fetch('/api/delivery-methods')
      .then((res) => res.json())
      .then((data) => setDeliveryMethods(data))
      .catch(console.error)
  }, [])

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return

    setIsApplyingDiscount(true)
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCodeInput,
          orderValue: subtotal,
        }),
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setDiscountCode(discountCodeInput, data.discountAmount, data.discountType)
        toast({
          title: 'Kod rabatowy zastosowany',
          description: `Rabat: ${formatPrice(data.discountAmount)}`,
        })
      } else {
        toast({
          title: 'Nieprawidlowy kod',
          description: data.message || 'Kod rabatowy jest nieprawidlowy lub wygasl',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zweryfikowac kodu',
        variant: 'destructive',
      })
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleDeliveryMethodChange = (methodId: string) => {
    const method = deliveryMethods.find((m) => m.id === methodId)
    if (method) {
      let price = method.price
      if (method.freeThreshold && subtotal >= method.freeThreshold) {
        price = 0
      }
      setDeliveryMethod(methodId, price)
    }
  }

  const handleSubmitOrder = async () => {
    if (!formData.acceptTerms) {
      toast({
        title: 'Wymagana akceptacja regulaminu',
        description: 'Zaakceptuj regulamin, aby kontynuowac',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Upload photos and create order
      const orderData = {
        customer: {
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
        },
        shipping: {
          name: formData.name,
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: 'Polska',
          phone: formData.phone,
        },
        deliveryMethodId,
        discountCode,
        notes: formData.notes,
        marketingConsent: formData.marketingConsent,
        photos: photos.map((p) => ({
          ...p,
          file: undefined, // Will be uploaded separately
        })),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await res.json()

      if (res.ok) {
        clearCart()
        router.push(`/zamowienie/${data.id}?payment=true`)
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: 'Blad skladania zamowienia',
        description: error.message || 'Sprobuj ponownie',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </header>
        <main className="flex-1 container py-16 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Koszyk jest pusty</h1>
          <p className="text-muted-foreground mb-6">
            Dodaj zdjecia do koszyka, aby kontynuowac
          </p>
          <Link href="/zamow">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wrocdo zamawiania
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span
              className={
                step === 'cart' ? 'font-bold text-primary' : 'text-muted-foreground'
              }
            >
              1. Koszyk
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span
              className={
                step === 'shipping' ? 'font-bold text-primary' : 'text-muted-foreground'
              }
            >
              2. Dane i dostawa
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span
              className={
                step === 'payment' ? 'font-bold text-primary' : 'text-muted-foreground'
              }
            >
              3. Platnosc
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'cart' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Twoje zdjecia ({photos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {photo.thumbnailUrl ? (
                            <img
                              src={photo.thumbnailUrl}
                              alt={photo.originalName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{photo.originalName}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline">{photo.formatName}</Badge>
                            {photo.paperTypeName && (
                              <Badge variant="outline">{photo.paperTypeName}</Badge>
                            )}
                            {photo.copies > 1 && (
                              <Badge variant="secondary">x{photo.copies}</Badge>
                            )}
                          </div>
                          {photo.qualityLevel &&
                            (photo.qualityLevel === 'warning' ||
                              photo.qualityLevel === 'poor') && (
                              <p className="text-xs text-yellow-600 mt-1">
                                {photo.qualityMessage}
                              </p>
                            )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(photo.totalPrice)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhoto(photo.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Discount code */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Kod rabatowy"
                          value={discountCodeInput}
                          onChange={(e) => setDiscountCodeInput(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount}
                      >
                        {isApplyingDiscount && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Zastosuj
                      </Button>
                    </div>
                    {discountCode && (
                      <p className="text-sm text-green-600 mt-2">
                        Zastosowano kod: {discountCode} (-{formatPrice(discountAmount)})
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {step === 'shipping' && (
              <>
                {/* Customer data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dane kontaktowe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Imie i nazwisko *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Adres dostawy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Ulica i numer *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Kod pocztowy *</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) =>
                            setFormData({ ...formData, postalCode: e.target.value })
                          }
                          placeholder="00-000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Miasto *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Metoda dostawy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={deliveryMethodId || ''}
                      onValueChange={handleDeliveryMethodChange}
                    >
                      {deliveryMethods.map((method) => {
                        const isFree =
                          method.freeThreshold && subtotal >= method.freeThreshold
                        return (
                          <div
                            key={method.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label
                              htmlFor={method.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{method.name}</p>
                                  {method.estimatedDays && (
                                    <p className="text-sm text-muted-foreground">
                                      {method.estimatedDays}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {isFree ? (
                                    <>
                                      <p className="font-bold text-green-600">
                                        Gratis
                                      </p>
                                      <p className="text-xs line-through text-muted-foreground">
                                        {formatPrice(method.price)}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="font-bold">
                                      {formatPrice(method.price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Uwagi do zamowienia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                      placeholder="Dodatkowe informacje..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {step === 'payment' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Metoda platnosci
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup defaultValue="online">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="cursor-pointer">
                          <p className="font-medium">Platnosc online</p>
                          <p className="text-sm text-muted-foreground">
                            Karta, BLIK, przelew
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              acceptTerms: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="terms" className="text-sm cursor-pointer">
                          Akceptuje{' '}
                          <Link href="/regulamin" className="text-primary underline">
                            regulamin
                          </Link>{' '}
                          i{' '}
                          <Link
                            href="/polityka-prywatnosci"
                            className="text-primary underline"
                          >
                            polityke prywatnosci
                          </Link>{' '}
                          *
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="marketing"
                          checked={formData.marketingConsent}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              marketingConsent: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="marketing" className="text-sm cursor-pointer">
                          Wyrazam zgode na otrzymywanie informacji marketingowych
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Podsumowanie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Zdjecia ({photos.length})
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Rabat</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostawa</span>
                  <span>
                    {deliveryMethodId ? formatPrice(deliveryPrice) : '-'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Netto</span>
                  <span>
                    {formatPrice(subtotal - discountAmount + deliveryPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT 23%</span>
                  <span>{formatPrice(vatAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Razem brutto</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <div className="pt-4 space-y-2">
                  {step === 'cart' && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => setStep('shipping')}
                      >
                        Dalej
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Link href="/zamow">
                        <Button variant="outline" className="w-full">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Dodaj wiecej zdjec
                        </Button>
                      </Link>
                    </>
                  )}

                  {step === 'shipping' && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => setStep('payment')}
                        disabled={
                          !formData.email ||
                          !formData.name ||
                          !formData.street ||
                          !formData.city ||
                          !formData.postalCode ||
                          !deliveryMethodId
                        }
                      >
                        Dalej do platnosci
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep('cart')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Wrocdo koszyka
                      </Button>
                    </>
                  )}

                  {step === 'payment' && (
                    <>
                      <Button
                        className="w-full"
                        onClick={handleSubmitOrder}
                        disabled={isLoading || !formData.acceptTerms}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Zamawiam i place
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep('shipping')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Wrocdo danych
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
