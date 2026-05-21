'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getLeads, getFormTemplates } from '@/lib/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  FileText,
  Users,
  Activity,
  Menu,
} from 'lucide-react'

export default function DashboardHome() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalForms: 0,
    newLeads: 0,
    activeTeam: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return

      try {
        const leads = await getLeads(userData.organizationId, [])
        const forms = await getFormTemplates(userData.organizationId)

        const newLeadsCount = leads.filter(
          (lead) => lead.status === 'new'
        ).length

        // Create mock chart data for last 7 days
        const chartData = Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          leads: Math.floor(Math.random() * 10) + leads.length / 7,
        }))

        setStats({
          totalLeads: leads.length,
          totalForms: forms.length,
          newLeads: newLeadsCount,
          activeTeam: 1,
        })
        setChartData(chartData)
      } catch (error) {
        console.error('[v0] Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {userData?.displayName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-2">Here&apos;s your CRM overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-2">All time leads collected</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-accent/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.newLeads}</div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting follow up</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-secondary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Forms</CardTitle>
                <Activity className="w-5 h-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalForms}</div>
              <p className="text-xs text-muted-foreground mt-2">Lead collection forms</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeTeam}</div>
              <p className="text-xs text-muted-foreground mt-2">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Lead Collection Trend</CardTitle>
            <CardDescription>Leads collected over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: '#60A5FA20' }}
                />
                <Bar dataKey="leads" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/leads/new">
                <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <FileText className="w-5 h-5" />
                  Add New Lead Manually
                </Button>
              </Link>
              <Link href="/dashboard/forms/new">
                <Button className="w-full justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Activity className="w-5 h-5" />
                  Create New Form
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/forms">
                <Button variant="outline" className="w-full justify-start gap-2 border-border">
                  <Menu className="w-5 h-5" />
                  Manage Forms
                </Button>
              </Link>
              <Link href="/dashboard/team">
                <Button variant="outline" className="w-full justify-start gap-2 border-border">
                  <Users className="w-5 h-5" />
                  Invite Team Members
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
