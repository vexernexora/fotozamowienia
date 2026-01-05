import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Camera,
  Upload,
  Settings,
  Truck,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react'
import { getTenantByHost } from '@/lib/tenant'
import { db } from '@/lib/db'

async function getProducts(tenantId: string) {
  return db.product.findMany({
    where: { tenantId, isActive: true },
    include: {
      formats: {
        where: { isActive: true },
        include: { format: true },
        orderBy: { format: { sortOrder: 'asc' } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
}

async function getFaq(tenantId: string) {
  return db.faqItem.findMany({
    where: { tenantId, isPublished: true },
    orderBy: { sortOrder: 'asc' },
  })
}

async function getDeliveryMethods(tenantId: string) {
  return db.deliveryMethod.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function HomePage() {
  const tenant = await getTenantByHost()

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Nie znaleziono sklepu</p>
      </div>
    )
  }

  const [products, faq, deliveryMethods] = await Promise.all([
    getProducts(tenant.id),
    getFaq(tenant.id),
    getDeliveryMethods(tenant.id),
  ])

  const settings = tenant.settings

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#oferta" className="text-sm font-medium hover:text-primary">
              Oferta
            </Link>
            <Link href="#jak-to-dziala" className="text-sm font-medium hover:text-primary">
              Jak to dziala
            </Link>
            <Link href="#cennik" className="text-sm font-medium hover:text-primary">
              Cennik
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary">
              FAQ
            </Link>
            <Link href="#kontakt" className="text-sm font-medium hover:text-primary">
              Kontakt
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/konto">
              <Button variant="ghost" size="sm">
                Moje konto
              </Button>
            </Link>
            <Link href="/zamow">
              <Button size="sm">
                Zamow teraz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Profesjonalny wydruk zdjec{' '}
              <span className="text-primary">online</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Zaladuj zdjecia, wybierz format i papier, a my zajmiemy sie reszta.
              Wysoka jakosc druku i szybka dostawa prosto do Twoich drzwi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/zamow">
                <Button size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Zaladuj zdjecia
                </Button>
              </Link>
              <Link href="#oferta">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Zobacz oferte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Wysoka jakosc</h3>
              <p className="text-sm text-muted-foreground">
                Profesjonalne papiery fotograficzne i precyzyjny druk
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Szybka realizacja</h3>
              <p className="text-sm text-muted-foreground">
                Zamowienia realizowane w ciagu 24-48 godzin
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Wygodna dostawa</h3>
              <p className="text-sm text-muted-foreground">
                Kurier, paczkomat lub odbior osobisty
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Gwarancja jakosci</h3>
              <p className="text-sm text-muted-foreground">
                Pelna satysfakcja lub zwrot pieniedzy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products / Oferta */}
      <section id="oferta" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nasza oferta</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wybierz sposrod szerokiej gamy produktow fotograficznych
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {product.description || 'Profesjonalny wydruk najwyzszej jakosci'}
                  </p>
                  {product.formats.length > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Od </span>
                      <span className="text-primary font-bold">
                        {product.formats[0].basePrice.toFixed(2)} zl
                      </span>
                    </p>
                  )}
                  <Link href={`/zamow?product=${product.slug}`}>
                    <Button variant="link" className="p-0 mt-2 group-hover:text-primary">
                      Zamow teraz
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="jak-to-dziala" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Jak to dziala</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Zamowienie zdjec jest proste i szybkie
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="absolute top-6 left-1/2 w-full h-0.5 bg-border hidden md:block" />
              <div className="relative bg-background rounded-lg p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Zaladuj zdjecia</h3>
                <p className="text-sm text-muted-foreground">
                  Przeciagnij i upusc lub wybierz pliki z dysku
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-6 left-1/2 w-full h-0.5 bg-border hidden md:block" />
              <div className="relative bg-background rounded-lg p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Wybierz opcje</h3>
                <p className="text-sm text-muted-foreground">
                  Format, papier, wykoczenie i ilosc
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-6 left-1/2 w-full h-0.5 bg-border hidden md:block" />
              <div className="relative bg-background rounded-lg p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Dostosuj kadr</h3>
                <p className="text-sm text-muted-foreground">
                  Podglad i regulacja kadrowania
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-background rounded-lg p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-2">Zamow i odbierz</h3>
                <p className="text-sm text-muted-foreground">
                  Platnosc online i szybka dostawa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="cennik" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cennik</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Przejrzyste ceny bez ukrytych kosztow. Im wiecej zamawiasz, tym taniej.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            {products.map((product) => (
              <div key={product.id} className="mb-8">
                <h3 className="text-xl font-semibold mb-4">{product.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.formats.slice(0, 8).map((pf) => (
                    <Card key={pf.id}>
                      <CardContent className="p-4 text-center">
                        <p className="font-medium">{pf.format.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pf.format.widthMm}x{pf.format.heightMm} mm
                        </p>
                        <p className="text-lg font-bold text-primary mt-2">
                          {pf.basePrice.toFixed(2)} zl
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Ceny netto. Do kazdego zamowienia doliczany jest VAT 23%.
            </p>
            <Link href="/zamow">
              <Button>
                Przejdz do zamowienia
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dostawa</h2>
            <p className="text-muted-foreground">Wybierz wygodna metode dostawy</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {deliveryMethods.map((method) => (
              <Card key={method.id}>
                <CardContent className="p-6 text-center">
                  <Truck className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {method.estimatedDays}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {method.price === 0 ? 'Gratis' : `${method.price.toFixed(2)} zl`}
                  </p>
                  {method.freeThreshold && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Darmowa dostawa od {method.freeThreshold.toFixed(2)} zl
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Czesto zadawane pytania</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, index) => (
                <AccordionItem key={item.id} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="kontakt" className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Kontakt</h2>
            <p className="text-muted-foreground mb-8">
              Masz pytania? Skontaktuj sie z nami.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">
                    {settings?.companyEmail || 'kontakt@fotodruk.pl'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <p className="text-muted-foreground">
                    {settings?.companyPhone || '+48 123 456 789'}
                  </p>
                </CardContent>
              </Card>
            </div>
            {settings?.companyAddress && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Adres</h3>
                  <p className="text-muted-foreground">{settings.companyAddress}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Gotowy na profesjonalne wydruki?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Dolacz do tysiecy zadowolonych klientow i zamow swoje zdjecia juz dzis.
          </p>
          <Link href="/zamow">
            <Button size="lg" variant="secondary">
              Zamow teraz
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Profesjonalny wydruk zdjec online z dostawa do domu.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkty</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link href={`/zamow?product=${p.slug}`} className="hover:text-primary">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Informacje</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/regulamin" className="hover:text-primary">
                    Regulamin
                  </Link>
                </li>
                <li>
                  <Link href="/polityka-prywatnosci" className="hover:text-primary">
                    Polityka prywatnosci
                  </Link>
                </li>
                <li>
                  <Link href="/dostawa" className="hover:text-primary">
                    Dostawa i platnosci
                  </Link>
                </li>
                <li>
                  <Link href="/reklamacje" className="hover:text-primary">
                    Reklamacje i zwroty
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{settings?.companyEmail || 'kontakt@fotodruk.pl'}</li>
                <li>{settings?.companyPhone || '+48 123 456 789'}</li>
                <li>{settings?.companyAddress}</li>
                {settings?.companyNip && <li>NIP: {settings.companyNip}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              {new Date().getFullYear()} {settings?.companyName || 'FotoDruk'}. Wszelkie prawa zastrzezone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
