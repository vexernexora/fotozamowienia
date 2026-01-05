import { PrismaClient, ProductType, DeliveryType, DiscountType, EmailTemplateType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'FotoDruk',
      slug: 'default',
      isActive: true,
    },
  })

  console.log('Created tenant:', tenant.name)

  // Create tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      siteTitle: 'FotoDruk - Profesjonalny wydruk zdjec online',
      siteDescription: 'Zamow wydruk zdjec online. Odbitki, plakaty, fotoalbumy i obrazy na plotnie. Szybka realizacja i wysoka jakosc.',
      companyName: 'FotoDruk Sp. z o.o.',
      companyAddress: 'ul. Fotograficzna 15, 00-001 Warszawa',
      companyNip: '1234567890',
      companyPhone: '+48 123 456 789',
      companyEmail: 'kontakt@fotodruk.pl',
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      accentColor: '#f59e0b',
      vatRate: 23,
      allowGuestCheckout: true,
      showPricesWithVat: true,
      maxUploadSizeMb: 50,
      maxFilesPerOrder: 100,
      defaultCropMode: 'fit',
      showQualityWarnings: true,
      minDpi: 150,
      recommendedDpi: 300,
      originalRetentionDays: 90,
    },
  })

  console.log('Created tenant settings')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'admin@fotodruk.pl',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      email: 'admin@fotodruk.pl',
      passwordHash: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      tenantId: tenant.id,
      isActive: true,
    },
  })

  console.log('Created admin user: admin@fotodruk.pl / admin123')

  // Create formats
  const formats = [
    { name: '9x13', widthMm: 90, heightMm: 130, sortOrder: 1 },
    { name: '10x15', widthMm: 100, heightMm: 150, sortOrder: 2 },
    { name: '13x18', widthMm: 130, heightMm: 180, sortOrder: 3 },
    { name: '15x21', widthMm: 150, heightMm: 210, sortOrder: 4 },
    { name: '20x30', widthMm: 200, heightMm: 300, sortOrder: 5 },
    { name: '30x40', widthMm: 300, heightMm: 400, sortOrder: 6 },
    { name: '30x45', widthMm: 300, heightMm: 450, sortOrder: 7 },
    { name: '40x60', widthMm: 400, heightMm: 600, sortOrder: 8 },
    { name: '50x70', widthMm: 500, heightMm: 700, sortOrder: 9 },
    { name: '60x90', widthMm: 600, heightMm: 900, sortOrder: 10 },
    { name: '10x10', widthMm: 100, heightMm: 100, isSquare: true, sortOrder: 11 },
    { name: '15x15', widthMm: 150, heightMm: 150, isSquare: true, sortOrder: 12 },
    { name: '20x20', widthMm: 200, heightMm: 200, isSquare: true, sortOrder: 13 },
    { name: '30x30', widthMm: 300, heightMm: 300, isSquare: true, sortOrder: 14 },
  ]

  for (const format of formats) {
    await prisma.format.upsert({
      where: {
        name_tenantId: {
          name: format.name,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...format,
        tenantId: tenant.id,
        minDpi: 150,
        isActive: true,
      },
    })
  }

  console.log('Created formats')

  // Create paper types
  const paperTypes = [
    { name: 'Blyszczacy', surcharge: 0, isDefault: true, sortOrder: 1 },
    { name: 'Matowy', surcharge: 0, sortOrder: 2 },
    { name: 'Satynowy', surcharge: 0.50, sortOrder: 3 },
    { name: 'Perla', surcharge: 1.00, sortOrder: 4 },
    { name: 'Metalic', surcharge: 2.00, sortOrder: 5 },
  ]

  for (const paper of paperTypes) {
    await prisma.paperType.upsert({
      where: {
        name_tenantId: {
          name: paper.name,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...paper,
        tenantId: tenant.id,
        surchargeType: 'flat',
        isActive: true,
      },
    })
  }

  console.log('Created paper types')

  // Create finish types
  const finishTypes = [
    { name: 'Standard', surcharge: 0, isDefault: true, sortOrder: 1 },
    { name: 'Laminat UV', surcharge: 1.50, sortOrder: 2 },
    { name: 'Laminat matowy', surcharge: 1.50, sortOrder: 3 },
    { name: 'Zaokraglone rogi', surcharge: 0.50, sortOrder: 4 },
  ]

  for (const finish of finishTypes) {
    await prisma.finishType.upsert({
      where: {
        name_tenantId: {
          name: finish.name,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...finish,
        tenantId: tenant.id,
        surchargeType: 'flat',
        isActive: true,
      },
    })
  }

  console.log('Created finish types')

  // Create products
  const products = [
    {
      name: 'Odbitki fotograficzne',
      slug: 'odbitki',
      type: ProductType.PRINT,
      description: 'Klasyczne odbitki na wysokiej jakosci papierze fotograficznym',
      sortOrder: 1,
      formats: ['9x13', '10x15', '13x18', '15x21', '10x10', '15x15'],
      basePrices: [0.49, 0.59, 0.89, 1.29, 0.99, 1.49],
    },
    {
      name: 'Plakaty',
      slug: 'plakaty',
      type: ProductType.POSTER,
      description: 'Wielkoformatowe plakaty i fotoplakaty',
      sortOrder: 2,
      formats: ['20x30', '30x40', '30x45', '40x60', '50x70', '60x90', '20x20', '30x30'],
      basePrices: [9.90, 14.90, 17.90, 24.90, 34.90, 49.90, 12.90, 19.90],
    },
    {
      name: 'Fotoalbumy',
      slug: 'fotoalbumy',
      type: ProductType.ALBUM,
      description: 'Eleganckie fotoalbumy z Twoimi zdjeciami',
      sortOrder: 3,
      minPhotos: 20,
      maxPhotos: 100,
      formats: ['20x20', '30x30'],
      basePrices: [89.00, 129.00],
    },
    {
      name: 'Obrazy na plotnie',
      slug: 'obrazy-na-plotnie',
      type: ProductType.CANVAS,
      description: 'Twoje zdjecia na plotnie canvas rozpiete na blejtramie',
      sortOrder: 4,
      formats: ['30x40', '40x60', '50x70', '60x90', '30x30'],
      basePrices: [59.00, 89.00, 119.00, 159.00, 69.00],
    },
  ]

  const dbFormats = await prisma.format.findMany({
    where: { tenantId: tenant.id },
  })

  for (const product of products) {
    const dbProduct = await prisma.product.upsert({
      where: {
        slug_tenantId: {
          slug: product.slug,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        type: product.type,
        description: product.description,
        sortOrder: product.sortOrder,
        minPhotos: product.minPhotos || 1,
        maxPhotos: product.maxPhotos || 1,
        tenantId: tenant.id,
        isActive: true,
        allowBorder: true,
        allowExpress: true,
        expressSurcharge: 50,
        expressSurchargeType: 'percentage',
      },
    })

    // Create product formats with prices
    for (let i = 0; i < product.formats.length; i++) {
      const formatName = product.formats[i]
      const basePrice = product.basePrices[i]
      const format = dbFormats.find((f) => f.name === formatName)

      if (format) {
        await prisma.productFormat.upsert({
          where: {
            productId_formatId: {
              productId: dbProduct.id,
              formatId: format.id,
            },
          },
          update: { basePrice },
          create: {
            productId: dbProduct.id,
            formatId: format.id,
            basePrice,
            isActive: true,
          },
        })
      }
    }
  }

  console.log('Created products with formats')

  // Create pricing rules (quantity discounts)
  const printProduct = await prisma.product.findFirst({
    where: { slug: 'odbitki', tenantId: tenant.id },
    include: { formats: true },
  })

  if (printProduct) {
    for (const pf of printProduct.formats) {
      const rules = [
        { minQuantity: 1, maxQuantity: 9, discountPercent: 0 },
        { minQuantity: 10, maxQuantity: 49, discountPercent: 10 },
        { minQuantity: 50, maxQuantity: 99, discountPercent: 15 },
        { minQuantity: 100, maxQuantity: null, discountPercent: 20 },
      ]

      for (const rule of rules) {
        await prisma.pricingRule.create({
          data: {
            tenantId: tenant.id,
            productFormatId: pf.id,
            minQuantity: rule.minQuantity,
            maxQuantity: rule.maxQuantity,
            discountPercent: rule.discountPercent,
            isActive: true,
          },
        })
      }
    }
  }

  console.log('Created pricing rules')

  // Create delivery methods
  const deliveryMethods = [
    {
      name: 'Kurier DPD',
      type: DeliveryType.COURIER,
      price: 14.99,
      freeThreshold: 100,
      estimatedDays: '1-2 dni robocze',
      sortOrder: 1,
    },
    {
      name: 'Paczkomat InPost',
      type: DeliveryType.PARCEL_LOCKER,
      price: 12.99,
      freeThreshold: 100,
      estimatedDays: '1-2 dni robocze',
      sortOrder: 2,
    },
    {
      name: 'Poczta Polska',
      type: DeliveryType.POSTAL,
      price: 9.99,
      freeThreshold: 150,
      estimatedDays: '3-5 dni roboczych',
      sortOrder: 3,
    },
    {
      name: 'Odbior osobisty',
      type: DeliveryType.PICKUP,
      price: 0,
      freeThreshold: null,
      estimatedDays: '1 dzien roboczy',
      pickupAddress: 'ul. Fotograficzna 15, 00-001 Warszawa',
      pickupHours: 'Pn-Pt 9:00-17:00',
      sortOrder: 4,
    },
  ]

  for (const method of deliveryMethods) {
    await prisma.deliveryMethod.upsert({
      where: {
        name_tenantId: {
          name: method.name,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...method,
        tenantId: tenant.id,
        isActive: true,
      },
    })
  }

  console.log('Created delivery methods')

  // Create discount codes
  const discountCodes = [
    {
      code: 'WELCOME10',
      description: 'Rabat powitalny 10%',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValue: 50,
    },
    {
      code: 'ZIMA2024',
      description: 'Promocja zimowa 15%',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minOrderValue: 100,
      maxUses: 100,
    },
    {
      code: 'DOSTAWA',
      description: 'Darmowa dostawa',
      discountType: DiscountType.FREE_SHIPPING,
      discountValue: 0,
      minOrderValue: 50,
    },
    {
      code: 'RABAT20',
      description: '20 zl rabatu',
      discountType: DiscountType.FIXED,
      discountValue: 20,
      minOrderValue: 80,
    },
  ]

  for (const code of discountCodes) {
    await prisma.discountCode.upsert({
      where: {
        code_tenantId: {
          code: code.code,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...code,
        tenantId: tenant.id,
        isActive: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    })
  }

  console.log('Created discount codes')

  // Create FAQ items
  const faqItems = [
    {
      question: 'Jakie formaty zdjec akceptujecie?',
      answer: 'Akceptujemy pliki JPEG, PNG, WebP oraz TIFF. Maksymalny rozmiar pliku to 50MB.',
      category: 'Zamowienia',
      sortOrder: 1,
    },
    {
      question: 'Jak dlugo trwa realizacja zamowienia?',
      answer: 'Standardowe zamowienia realizujemy w ciagu 24-48 godzin roboczych. Dla zamowien ekspresowych czas realizacji to do 24 godzin.',
      category: 'Zamowienia',
      sortOrder: 2,
    },
    {
      question: 'Jaka jest minimalna rozdzielczosc zdjec?',
      answer: 'Zalecamy minimum 150 DPI dla wybranego formatu. System automatycznie ostrzeze Cie, jesli jakosc zdjecia jest zbyt niska.',
      category: 'Jakosc',
      sortOrder: 3,
    },
    {
      question: 'Czy moge zwrocic zamowienie?',
      answer: 'Tak, akceptujemy zwroty w ciagu 14 dni od otrzymania przesylki. Zdjecia musza byc nieuszkodzone i w oryginalnym opakowaniu.',
      category: 'Zwroty',
      sortOrder: 4,
    },
    {
      question: 'Jakie metody platnosci akceptujecie?',
      answer: 'Akceptujemy platnosci online kartami, BLIK oraz przelewy bankowe.',
      category: 'Platnosci',
      sortOrder: 5,
    },
    {
      question: 'Czy oferujecie darmowa dostawe?',
      answer: 'Tak, przy zamowieniach powyzej 100 zl dostawa kurierem i do paczkomatu jest gratis.',
      category: 'Dostawa',
      sortOrder: 6,
    },
  ]

  for (const faq of faqItems) {
    await prisma.faqItem.create({
      data: {
        ...faq,
        tenantId: tenant.id,
        isPublished: true,
      },
    })
  }

  console.log('Created FAQ items')

  // Create pages
  const pages = [
    {
      slug: 'regulamin',
      title: 'Regulamin',
      content: `
        <h2>Regulamin sklepu FotoDruk</h2>
        <p>Niniejszy regulamin okresla zasady korzystania ze sklepu internetowego FotoDruk.</p>

        <h3>1. Postanowienia ogolne</h3>
        <p>Sklep internetowy FotoDruk prowadzony jest przez FotoDruk Sp. z o.o. z siedziba w Warszawie.</p>

        <h3>2. Skladanie zamowien</h3>
        <p>Zamowienia mozna skladac przez strone internetowa 24/7. Realizacja zamowien odbywa sie w dni robocze.</p>

        <h3>3. Platnosci</h3>
        <p>Akceptujemy platnosci online kartami platniczymi, BLIK oraz przelewy bankowe.</p>

        <h3>4. Dostawa</h3>
        <p>Zamowienia dostarczamy na terenie Polski za posrednictwem firm kurierskich oraz do paczkomatow InPost.</p>

        <h3>5. Reklamacje i zwroty</h3>
        <p>Reklamacje mozna skladac w ciagu 14 dni od daty otrzymania przesylki.</p>
      `,
      showInFooter: true,
      sortOrder: 1,
    },
    {
      slug: 'polityka-prywatnosci',
      title: 'Polityka prywatnosci',
      content: `
        <h2>Polityka prywatnosci</h2>
        <p>Niniejsza polityka prywatnosci okresla zasady przetwarzania danych osobowych w sklepie FotoDruk.</p>

        <h3>1. Administrator danych</h3>
        <p>Administratorem danych osobowych jest FotoDruk Sp. z o.o. z siedziba w Warszawie.</p>

        <h3>2. Cel przetwarzania danych</h3>
        <p>Dane osobowe przetwarzamy w celu realizacji zamowien, obslugi klienta oraz marketingu bezposredniego.</p>

        <h3>3. Przechowywanie danych</h3>
        <p>Zdjecia przesylane przez klientow sa przechowywane przez 90 dni od realizacji zamowienia, chyba ze klient wyrazi zgode na dluzsze przechowywanie.</p>

        <h3>4. Prawa uzytkownika</h3>
        <p>Uzytkownicy maja prawo dostepu do swoich danych, ich poprawiania oraz usuwania.</p>
      `,
      showInFooter: true,
      sortOrder: 2,
    },
  ]

  for (const page of pages) {
    await prisma.page.upsert({
      where: {
        slug_tenantId: {
          slug: page.slug,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...page,
        tenantId: tenant.id,
        isPublished: true,
      },
    })
  }

  console.log('Created pages')

  // Create email templates
  const emailTemplates = [
    {
      type: EmailTemplateType.ORDER_CONFIRMATION,
      subject: 'Potwierdzenie zamowienia {{orderNumber}}',
      bodyHtml: '<h1>Dziekujemy za zamowienie!</h1><p>Twoje zamowienie {{orderNumber}} zostalo przyjete.</p>',
    },
    {
      type: EmailTemplateType.PAYMENT_RECEIVED,
      subject: 'Platnosc otrzymana - {{orderNumber}}',
      bodyHtml: '<h1>Platnosc potwierdzona</h1><p>Otrzymalismy platnosc za zamowienie {{orderNumber}}.</p>',
    },
    {
      type: EmailTemplateType.ORDER_SHIPPED,
      subject: 'Zamowienie wyslane - {{orderNumber}}',
      bodyHtml: '<h1>Twoje zamowienie w drodze!</h1><p>Zamowienie {{orderNumber}} zostalo wyslane.</p>',
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: {
        type_tenantId: {
          type: template.type,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        ...template,
        tenantId: tenant.id,
        isActive: true,
      },
    })
  }

  console.log('Created email templates')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
