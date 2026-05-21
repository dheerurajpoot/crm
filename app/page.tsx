'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [currentUser, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Loading...</p>
      </div>
    </div>
  )
}
