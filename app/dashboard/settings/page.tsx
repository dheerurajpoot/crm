'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Bell, Lock, Database } from 'lucide-react'

export default function SettingsPage() {
  const { userData, isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-border bg-card max-w-md w-full mx-4">
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground">
                Only administrators can access settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your organization and preferences</p>
        </div>

        {/* Account Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Display Name</label>
              <Input
                type="text"
                value={userData?.displayName || ''}
                disabled
                className="bg-input border-border disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email</label>
              <Input
                type="email"
                value={userData?.email || ''}
                disabled
                className="bg-input border-border disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Role</label>
              <Input
                type="text"
                value={userData?.role.charAt(0).toUpperCase() + userData?.role.slice(1) || ''}
                disabled
                className="bg-input border-border disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
              <h4 className="font-medium text-foreground mb-2">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                Enable 2FA
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
              <h4 className="font-medium text-foreground mb-2">Password</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Change your account password
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>Manage your organization preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Organization ID</label>
              <Input
                type="text"
                value={userData?.organizationId || ''}
                disabled
                className="bg-input border-border disabled:opacity-50 font-mono text-xs"
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
              <h4 className="font-medium text-foreground mb-2">Data Retention</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically delete old leads after a specified period
              </p>
              <select className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground">
                <option>Never</option>
                <option>After 30 days</option>
                <option>After 90 days</option>
                <option>After 1 year</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Email notifications for new leads', id: 'new_leads' },
              { label: 'Daily summary emails', id: 'daily_summary' },
              { label: 'Team activity updates', id: 'team_activity' },
              { label: 'Form submission alerts', id: 'form_alerts' },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-foreground">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Data & Export */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-secondary" />
              Data & Export
            </CardTitle>
            <CardDescription>Manage your organization data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
              <h4 className="font-medium text-foreground mb-2">Export All Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your leads and form data as Excel files
              </p>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                Export Data
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-red-400 mb-2">Danger Zone</h4>
              <p className="text-sm text-red-400/80 mb-4">
                Delete all organization data. This action cannot be undone.
              </p>
              <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                Delete Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
