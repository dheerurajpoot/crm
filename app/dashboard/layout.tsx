'use client'

import { useAuth } from '@/lib/auth-context'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import MobileNav from '@/components/dashboard/mobile-nav'
import DashboardHeader from '@/components/dashboard/dashboard-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-border">
        <DashboardNav />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <MobileNav />
      </div>
    </div>
  )
}
