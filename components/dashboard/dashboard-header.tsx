'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getOrganization } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { LogOut, Building, User, Loader2, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

export default function DashboardHeader() {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [orgName, setOrgName] = useState<string>('')
  const [loadingOrg, setLoadingOrg] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchOrg = async () => {
      if (!userData?.organizationId) return
      setLoadingOrg(true)
      try {
        const org = await getOrganization(userData.organizationId)
        if (org) {
          setOrgName(org.name)
        }
      } catch (err) {
        console.error('[Header] Error fetching organization:', err)
      } finally {
        setLoadingOrg(false)
      }
    }
    fetchOrg()
  }, [userData?.organizationId])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('[Header] Logout error:', err)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border border-red-500/20'
      case 'manager':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      case 'agent':
        return 'bg-green-500/10 text-green-500 border border-green-500/20'
      case 'viewer':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
    }
  }

  if (!userData) return null

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-4 h-16 w-full backdrop-blur-sm z-30 shrink-0">
      {/* Left side: Welcome & Workspace Info */}
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold text-foreground">
          Hello, <span className="text-primary font-bold">{userData.displayName || userData.email}</span>
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Building className="w-3.5 h-3.5 text-muted-foreground" />
          {loadingOrg ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-xs text-muted-foreground font-medium">
              {orgName || 'LeadFlow CRM Workspace'}
            </span>
          )}
        </div>
      </div>

      {/* Right side: User Pill, Theme Switcher & Logout */}
      <div className="flex items-center gap-4">
        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 bg-muted/30 border border-border/50 rounded-full px-3 py-1">
          {/* Initials Avatar */}
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
            {userData.displayName ? getInitials(userData.displayName) : <User className="w-3 h-3" />}
          </div>
          {/* User Details */}
          <div className="hidden sm:flex flex-col text-left mr-1">
            <span className="text-[10px] font-bold text-foreground leading-none max-w-[120px] truncate">
              {userData.displayName || 'CRM User'}
            </span>
          </div>
          {/* Role badge */}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getRoleBadgeColor(userData.role)}`}>
            {userData.role}
          </span>
        </div>

        {/* Theme Switcher Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-full transition-all"
          title="Toggle Theme"
        >
          {!mounted ? (
            <div className="w-4 h-4 rounded-full border-border border animate-pulse" />
          ) : theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </Button>

        {/* Small Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0 rounded-full transition-all"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
