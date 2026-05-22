'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getOrganization } from '@/lib/firestore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Mail, Shield, CheckCircle, AlertCircle, Building, Key } from 'lucide-react'

export default function ProfilePage() {
  const { userData, setUserData, resetPassword } = useAuth()
  const [displayName, setDisplayName] = useState(userData?.displayName || '')
  const [orgDetails, setOrgDetails] = useState<{ name: string; createdAt: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrg = async () => {
      if (userData?.organizationId) {
        try {
          const org = await getOrganization(userData.organizationId)
          if (org) {
            setOrgDetails({
              name: org.name,
              createdAt: org.createdAt
            })
          }
        } catch (err) {
          console.error('[Profile] Error loading org:', err)
        }
      }
    }
    loadOrg()
  }, [userData?.organizationId])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return
    if (!displayName.trim()) {
      setError('Name cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const userRef = doc(db, 'users', userData.uid)
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: new Date(),
      })

      setUserData({
        ...userData,
        displayName: displayName.trim(),
      })
      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      console.error('[Profile] Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!userData?.email) return
    
    setResetting(true)
    setError('')
    setSuccess('')

    try {
      await resetPassword(userData.email)
      setSuccess('Password reset link sent to your email!')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link')
    } finally {
      setResetting(false)
    }
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 mb-20 md:mb-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal account details and access permissions</p>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Personal Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>Update your display name and security here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    disabled
                    value={userData.email}
                    className="pl-10 bg-muted/40 border-border cursor-not-allowed opacity-80"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Your account email is managed by your administrator</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter full name"
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving || displayName.trim() === userData.displayName}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {saving ? 'Saving...' : 'Update Name'}
              </Button>
            </form>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium">Security</h3>
                  <p className="text-xs text-muted-foreground">Reset your account password</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {resetting ? 'Sending...' : 'Forget Password?'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles and Permissions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Role & System Access
            </CardTitle>
            <CardDescription>Your current access tier and permission mappings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">User Role</span>
                </div>
                <span className="text-base font-bold text-foreground capitalize">{userData.role}</span>
              </div>

              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold text-muted-foreground">Organization</span>
                </div>
                <span className="text-sm font-bold text-foreground truncate block">
                  {orgDetails?.name || (userData.organizationId ? 'Connected to CRM' : 'No Organization')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Granted Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {userData.permissions && userData.permissions.length > 0 ? (
                  userData.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No permissions assigned.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
