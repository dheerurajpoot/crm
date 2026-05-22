'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getLeads, getFormTemplates, getTeamMembers } from '@/lib/firestore'
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

  const getSafeDate = (value: any): Date => {
    if (!value) return new Date()
    if (value instanceof Date) return value
    if (typeof value.toDate === 'function') return value.toDate()
    if (value.seconds !== undefined) return new Date(value.seconds * 1000)
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return

      try {
        const [leads, forms, teamMembers] = await Promise.all([
          getLeads(userData.organizationId, []),
          getFormTemplates(userData.organizationId),
          getTeamMembers(userData.organizationId).catch(() => []),
        ])

        const newLeadsCount = leads.filter(
          (lead) => lead.status === 'new'
        ).length

        // Create real chart data for last 7 days
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          return {
            dateStr: d.toDateString(),
            dayLabel: daysOfWeek[d.getDay()],
            count: 0
          }
        })

        leads.forEach((lead) => {
          const leadDate = getSafeDate(lead.createdAt)
          const leadDateStr = leadDate.toDateString()
          const chartDay = last7Days.find((item) => item.dateStr === leadDateStr)
          if (chartDay) {
            chartDay.count++
          }
        })

        const realChartData = last7Days.map((item) => ({
          day: item.dayLabel,
          leads: item.count,
        }))

        setStats({
          totalLeads: leads.length,
          totalForms: forms.length,
          newLeads: newLeadsCount,
          activeTeam: teamMembers.length || 1,
        })
        setChartData(realChartData)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {userData?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here&apos;s your CRM overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Total Leads</CardTitle>
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalLeads}</div>
              <p className="text-[10px] text-muted-foreground mt-1">All time leads</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground">New Leads</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.newLeads}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting follow up</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-secondary/50 transition-colors">
            <CardHeader className="pb-2 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Active Forms</CardTitle>
                <Activity className="w-4 h-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalForms}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Collection forms</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Team Members</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.activeTeam}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Lead Collection Trend</CardTitle>
            <CardDescription className="text-xs">Leads collected over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="w-full h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    cursor={{ fill: '#60A5FA20' }}
                  />
                  <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
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
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Get Started</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
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
