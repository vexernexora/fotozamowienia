import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Haslo', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Wymagany email i haslo')
        }

        const tenantId = credentials.tenantId || 'default'

        const user = await db.user.findFirst({
          where: {
            email: credentials.email,
            tenant: {
              OR: [{ id: tenantId }, { slug: tenantId }],
            },
            isActive: true,
          },
          include: {
            tenant: true,
          },
        })

        if (!user) {
          throw new Error('Nieprawidlowe dane logowania')
        }

        const isValid = await compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Nieprawidlowe dane logowania')
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
        }
      },
    }),
    CredentialsProvider({
      id: 'customer-credentials',
      name: 'Customer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Haslo', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Wymagany email i haslo')
        }

        const tenantId = credentials.tenantId || 'default'

        const customer = await db.customer.findFirst({
          where: {
            email: credentials.email,
            tenant: {
              OR: [{ id: tenantId }, { slug: tenantId }],
            },
            passwordHash: { not: null },
          },
          include: {
            tenant: true,
          },
        })

        if (!customer || !customer.passwordHash) {
          throw new Error('Nieprawidlowe dane logowania')
        }

        const isValid = await compare(credentials.password, customer.passwordHash)

        if (!isValid) {
          throw new Error('Nieprawidlowe dane logowania')
        }

        await db.customer.update({
          where: { id: customer.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name || customer.email,
          role: 'CUSTOMER',
          tenantId: customer.tenantId,
          tenantSlug: customer.tenant.slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.tenantSlug = token.tenantSlug as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: string
      tenantSlug: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    tenantId: string
    tenantSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string
    tenantSlug: string
  }
}
