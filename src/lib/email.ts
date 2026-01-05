import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  // If no SMTP credentials, create a test account with Ethereal
  if (!user || !pass) {
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const transporter = await createTransporter()
    const from = process.env.SMTP_FROM || 'noreply@fotodruk.pl'

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    console.log('Email sent:', info.messageId)

    // If using ethereal, log the preview URL
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log('Preview URL:', previewUrl)
      }
    }

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendOrderConfirmation(
  orderId: string,
  tenantId: string
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          photos: {
            include: {
              productFormat: { include: { format: true } },
            },
          },
        },
      },
      deliveryMethod: true,
      tenant: { include: { settings: true } },
    },
  })

  if (!order) return

  const settings = order.tenant.settings
  const companyName = settings?.companyName || 'FotoDruk'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .order-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .item { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <p>Potwierdzenie zamowienia</p>
        </div>
        <div class="content">
          <h2>Dziekujemy za zamowienie!</h2>
          <p>Oto szczegoly Twojego zamowienia:</p>

          <div class="order-info">
            <p><strong>Numer zamowienia:</strong> ${order.orderNumber}</p>
            <p><strong>Data:</strong> ${order.createdAt.toLocaleDateString('pl-PL')}</p>
            <p><strong>Status:</strong> Oczekuje na platnosc</p>
          </div>

          <h3>Zamowione produkty</h3>
          <div class="order-info">
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <div>
                  <strong>${item.product.name}</strong>
                  <br>
                  <small>${item.photos.length} zdjec</small>
                </div>
                <div style="margin-left: auto; text-align: right;">
                  ${item.totalPriceNet.toFixed(2)} zl netto
                </div>
              </div>
            `
              )
              .join('')}

            <div class="total">
              <p>Suma netto: ${order.subtotalNet.toFixed(2)} zl</p>
              <p>Dostawa: ${order.deliveryPrice.toFixed(2)} zl</p>
              <p>VAT: ${order.vatAmount.toFixed(2)} zl</p>
              <p><strong>Razem brutto: ${order.totalGross.toFixed(2)} zl</strong></p>
            </div>
          </div>

          <h3>Adres dostawy</h3>
          <div class="order-info">
            <p>${order.shippingName}</p>
            <p>${order.shippingStreet}</p>
            <p>${order.shippingPostalCode} ${order.shippingCity}</p>
            <p>${order.shippingCountry}</p>
          </div>

          <p>Przejdz do platnosci, klikajac ponizszy link:</p>
          <p><a href="${process.env.NEXTAUTH_URL}/zamowienie/${order.id}?payment=true">Zaplac za zamowienie</a></p>
        </div>
        <div class="footer">
          <p>${companyName}</p>
          <p>${settings?.companyAddress || ''}</p>
          <p>${settings?.companyEmail || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Potwierdzenie zamowienia ${order.orderNumber} - ${companyName}`,
    html,
  })
}

export async function sendOrderStatusUpdate(
  orderId: string,
  newStatus: string
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      tenant: { include: { settings: true } },
    },
  })

  if (!order) return

  const settings = order.tenant.settings
  const companyName = settings?.companyName || 'FotoDruk'

  const statusMessages: Record<string, string> = {
    PAID: 'Twoje zamowienie zostalo oplacone i przekazane do realizacji.',
    PROCESSING: 'Twoje zamowienie jest w trakcie realizacji.',
    PRINTING: 'Twoje zdjecia sa wlasnie drukowane.',
    READY: 'Twoje zamowienie jest gotowe do wysylki.',
    SHIPPED: `Twoje zamowienie zostalo wyslane. ${order.trackingNumber ? `Numer sledzenia: ${order.trackingNumber}` : ''}`,
    DELIVERED: 'Twoje zamowienie zostalo dostarczone.',
    COMPLETED: 'Twoje zamowienie zostalo zakonczone. Dziekujemy za zakupy!',
  }

  const message = statusMessages[newStatus]
  if (!message) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .status { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <p>Aktualizacja zamowienia</p>
        </div>
        <div class="content">
          <div class="status">
            <h2>Zamowienie ${order.orderNumber}</h2>
            <p>${message}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/zamowienie/${order.id}">Zobacz szczegoly zamowienia</a>
          </p>
        </div>
        <div class="footer">
          <p>${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Aktualizacja zamowienia ${order.orderNumber} - ${companyName}`,
    html,
  })
}
