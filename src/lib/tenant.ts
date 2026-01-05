import { headers } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'

export type TenantWithSettings = Awaited<ReturnType<typeof getTenantByHost>>

export const getTenantByHost = cache(async (host?: string) => {
  const headersList = headers()
  const hostname = host || headersList.get('host') || 'localhost:3000'

  // Extract subdomain or use slug
  const mainDomain = process.env.MAIN_DOMAIN || 'localhost:3000'
  const enableMultiTenant = process.env.ENABLE_MULTI_TENANT === 'true'

  let tenantSlug = 'default'

  if (enableMultiTenant) {
    // Check for subdomain
    if (hostname !== mainDomain && hostname.endsWith(mainDomain)) {
      tenantSlug = hostname.replace(`.${mainDomain}`, '')
    } else if (hostname !== mainDomain) {
      // Custom domain - look up by customDomain
      const tenantByDomain = await db.tenant.findFirst({
        where: { customDomain: hostname, isActive: true },
        include: { settings: true },
      })
      if (tenantByDomain) {
        return tenantByDomain
      }
    }
  }

  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { slug: tenantSlug },
        { subdomain: tenantSlug },
        { slug: 'default' },
      ],
      isActive: true,
    },
    include: { settings: true },
    orderBy: {
      slug: tenantSlug === 'default' ? 'asc' : 'desc',
    },
  })

  return tenant
})

export const getTenantById = cache(async (id: string) => {
  const tenant = await db.tenant.findUnique({
    where: { id, isActive: true },
    include: { settings: true },
  })
  return tenant
})

export const getTenantBySlug = cache(async (slug: string) => {
  const tenant = await db.tenant.findFirst({
    where: { slug, isActive: true },
    include: { settings: true },
  })
  return tenant
})
