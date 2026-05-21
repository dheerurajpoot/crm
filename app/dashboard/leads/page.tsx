'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getLeads, getFormTemplates, updateLead, deleteLead } from '@/lib/firestore'
import { Lead, FormTemplate } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Search,
  Download,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react'
import LeadsTable from '@/components/dashboard/leads-table'
import LeadFilters from '@/components/dashboard/lead-filters'
import { exportLeadsToExcel } from '@/lib/export'

export default function LeadsPage() {
  const { userData, hasPermission } = useAuth()
  const [leads, setLeads] = useState<(Lead & { id: string })[]>([])
  const [filteredLeads, setFilteredLeads] = useState<(Lead & { id: string })[]>([])
  const [forms, setForms] = useState<(FormTemplate & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    formId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return

      try {
        const [leadsData, formsData] = await Promise.all([
          getLeads(userData.organizationId, []),
          getFormTemplates(userData.organizationId),
        ])
        setLeads(leadsData)
        setFilteredLeads(leadsData)
        setForms(formsData)
      } catch (error) {
        console.error('[v0] Error loading leads:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userData])

  // Apply filters
  useEffect(() => {
    let filtered = [...leads]

    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter((lead) =>
        JSON.stringify(lead.data).toLowerCase().includes(query)
      )
    }

    if (filters.formId !== 'all') {
      filtered = filtered.filter((lead) => lead.formId === filters.formId)
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((lead) => lead.status === filters.status)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((lead) => new Date(lead.createdAt) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      filtered = filtered.filter((lead) => new Date(lead.createdAt) <= toDate)
    }

    setFilteredLeads(filtered)
  }, [filters, leads])

  const handleExport = async () => {
    if (!userData || !hasPermission('export')) return

    setExporting(true)
    try {
      await exportLeadsToExcel(
        filteredLeads,
        forms,
        userData.organizationId
      )
    } catch (error) {
      console.error('[v0] Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-2">
              Total: <span className="font-semibold text-foreground">{filteredLeads.length}</span> lead{filteredLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('export') && (
              <Button
                onClick={handleExport}
                disabled={exporting || filteredLeads.length === 0}
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            )}
            <Link href="/dashboard/leads/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-5 h-5" />
                New Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <LeadFilters
          filters={filters}
          setFilters={setFilters}
          forms={forms}
        />

        {/* Leads Table */}
        {filteredLeads.length > 0 ? (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Leads Database</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsTable
                leads={filteredLeads}
                forms={forms}
                onUpdate={setLeads}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No leads found</h3>
                <p className="text-muted-foreground mb-6">
                  {leads.length === 0
                    ? 'Start by creating a form or adding leads manually'
                    : 'Try adjusting your filters'}
                </p>
                {leads.length === 0 && (
                  <Link href="/dashboard/forms/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Create First Form
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
