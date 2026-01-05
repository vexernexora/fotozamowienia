'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  Truck,
  Tag,
  Palette,
  Mail,
  HelpCircle,
  ImageIcon,
  Percent,
} from 'lucide-react'

interface SidebarProps {
  user: {
    role: string
  }
}

const menuItems = [
  {
    title: 'Glowne',
    items: [
      { href: '/admin', label: 'Pulpit', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'WORKER', 'SUPPORT'] },
      { href: '/admin/zamowienia', label: 'Zamowienia', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'WORKER', 'SUPPORT'] },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { href: '/admin/produkty', label: 'Produkty', icon: Package, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/formaty', label: 'Formaty', icon: ImageIcon, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/papiery', label: 'Papiery', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/wykończenia', label: 'Wykonczenia', icon: Palette, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/cenniki', label: 'Cenniki', icon: Tag, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/rabaty', label: 'Kody rabatowe', icon: Percent, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Sprzedaz',
    items: [
      { href: '/admin/klienci', label: 'Klienci', icon: Users, roles: ['ADMIN', 'MANAGER', 'SUPPORT'] },
      { href: '/admin/dostawa', label: 'Metody dostawy', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Tresci',
    items: [
      { href: '/admin/strony', label: 'Strony', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/faq', label: 'FAQ', icon: HelpCircle, roles: ['ADMIN', 'MANAGER'] },
      { href: '/admin/emaile', label: 'Szablony email', icon: Mail, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/ustawienia', label: 'Ustawienia', icon: Settings, roles: ['ADMIN'] },
      { href: '/admin/uzytkownicy', label: 'Uzytkownicy', icon: Users, roles: ['ADMIN'] },
    ],
  },
]

export function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <Link href="/admin">
          <Logo size="sm" />
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {menuItems.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(user.role)
            )

            if (visibleItems.length === 0) return null

            return (
              <div key={group.title}>
                <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
