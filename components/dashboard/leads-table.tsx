'use client'

import { useState } from 'react'
import { Lead, FormTemplate } from '@/lib/schemas'
import { formatDistanceToNow } from 'date-fns'
import { Edit2, Trash2, Eye, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LeadDetailModal from './lead-detail-modal'
import { useAuth } from '@/lib/auth-context'
import { deleteLead } from '@/lib/firestore'

interface LeadsTableProps {
  leads: (Lead & { id: string })[]
  forms: (FormTemplate & { id: string })[]
  onUpdate: (leads: (Lead & { id: string })[]) => void
}

export default function LeadsTable({ leads, forms, onUpdate }: LeadsTableProps) {
  const { userData, hasPermission } = useAuth()
  const [selectedLead, setSelectedLead] = useState<(Lead & { id: string }) | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (leadId: string) => {
    if (!userData || !hasPermission('delete')) return
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await deleteLead(userData.organizationId, leadId)
      onUpdate(leads.filter((l) => l.id !== leadId))
    } catch (error) {
      console.error('[v0] Delete error:', error)
    }
  }

  const getFormName = (formId: string) => {
    return forms.find((f) => f.id === formId)?.name || 'Unknown Form'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-400'
      case 'contacted':
        return 'bg-amber-500/20 text-amber-400'
      case 'qualified':
        return 'bg-green-500/20 text-green-400'
      case 'converted':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'lost':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Form</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const leadName = lead.data?.name || 'N/A'
              const isExpanded = expandedId === lead.id

              return (
                <tbody key={lead.id}>
                  <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{leadName}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.data?.email || lead.data?.phone || 'No contact'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{getFormName(lead.formId)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission('edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                          className="text-muted-foreground hover:text-accent hover:bg-accent/10"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      )}
                      {hasPermission('delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lead.id)}
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  {isExpanded && hasPermission('edit') && (
                    <tr className="border-b border-border/50 bg-muted/20">
                      <td colSpan={5} className="py-4 px-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Quick Edit</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(lead.data || {}).map(([key, value]) => (
                              <div key={key}>
                                <label className="text-xs font-medium text-muted-foreground capitalize">
                                  {key}
                                </label>
                                <p className="text-foreground text-sm mt-1">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="pt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => setSelectedLead(lead)}
                            >
                              Edit Full Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedId(null)}
                              className="border-border"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          forms={forms}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updatedLead) => {
            onUpdate(
              leads.map((l) => (l.id === updatedLead.id ? updatedLead : l))
            )
          }}
        />
      )}
    </>
  )
}
