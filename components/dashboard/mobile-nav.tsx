'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: FileText },
  { href: '/dashboard/forms', label: 'Forms', icon: Menu },
  { href: '/dashboard/team', label: 'Team', icon: Users, adminOnly: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <div className="flex h-16 items-center justify-around px-2 bg-card">
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
            <Icon
              className={`w-6 h-6 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
