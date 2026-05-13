import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userEmail={user.email} />

      {/* Main content area — extra bottom padding on mobile for bottom nav */}
      <main id="main-content" className="flex-1 pt-14 pb-20 md:pt-0 md:pb-0 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
