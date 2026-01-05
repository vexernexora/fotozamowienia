import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/Header'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/admin/login')
  }

  const userRole = session.user.role
  if (userRole === 'CUSTOMER') {
    redirect('/konto')
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <AdminSidebar user={session.user} />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
