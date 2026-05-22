'use client'

import { useState, Fragment } from 'react'
import { Lead, FormTemplate, Permission } from '@/lib/schemas'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Eye, ChevronDown, CheckCircle2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LeadDetailModal from './lead-detail-modal'
import { useAuth } from '@/lib/auth-context'
import { deleteLead, updateLead, createLeadActivity } from '@/lib/firestore'

const getSafeDate = (value: any): Date => {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (value.seconds !== undefined) return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

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
    if (!userData || !hasPermission(Permission.DELETE)) return
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await deleteLead(userData.organizationId, leadId)
      onUpdate(leads.filter((l) => l.id !== leadId))
    } catch (error) {
      console.error('[Table] Delete error:', error)
    }
  }

  const handleQuickDoneInTable = async (lead: Lead & { id: string }) => {
    if (!userData) return

    try {
      const updated = {
        ...lead,
        status: 'converted' as const,
      }
      
      await updateLead(userData.organizationId, lead.id, {
        status: 'converted',
      })

      // Log Activity
      try {
        await createLeadActivity(userData.organizationId, {
          leadId: lead.id,
          organizationId: userData.organizationId,
          userId: userData.uid,
          action: 'status_changed',
          changes: { status: 'converted', note: 'Marked lead as Converted via quick table button' },
        })
      } catch (actErr) {
        console.error('[Table] Failed to log activity:', actErr)
      }

      onUpdate(leads.map((l) => (l.id === lead.id ? updated : l)))
    } catch (error) {
      console.error('[Table] Quick Done error:', error)
    }
  }

  const getFormName = (formId: string) => {
    return forms.find((f) => f.id === formId)?.name || 'Unknown Form'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'contacted':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      case 'qualified':
        return 'bg-green-500/10 text-green-500 border border-green-500/20'
      case 'converted':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      case 'lost':
        return 'bg-red-500/10 text-red-500 border border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
    }
  }

  // Clipboard copier helper component
  const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!value) return
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch (err) {
        console.error('Failed to copy text:', err)
      }
    }

    return (
      <button
        type="button"
        onClick={handleCopy}
        className="h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center justify-center transition-colors ml-1"
        title={`Copy "${value}"`}
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    )
  }

  // Gather all unique custom keys present across all leads currently showing in the table
  const customKeys = Array.from(
    new Set(
      leads.flatMap((lead) =>
        Object.keys(lead.data || {}).filter(
          (k) => k !== 'name' && k !== 'email' && k !== 'phone'
        )
      )
    )
  )

  return (
    <>
      <div className="w-full">
        <table className="w-full text-sm block sm:table" suppressHydrationWarning>
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Form</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
              
              {/* Dynamic Columns */}
              {customKeys.map((key) => (
                <th key={key} className="text-left py-3 px-4 font-semibold text-muted-foreground capitalize">
                  {key}
                </th>
              ))}

              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="block sm:table-row-group" suppressHydrationWarning>
            {leads.map((lead) => {
              const leadName = (lead.data?.name as string) || 'N/A'
              const phoneVal = (lead.data?.phone as string) || 'No Phone'
              const isExpanded = expandedId === lead.id

              return (
                <Fragment key={lead.id}>
                  <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors flex flex-col p-4 mb-4 rounded-xl border border-border/60 bg-card/20 sm:table-row sm:p-0 sm:mb-0 sm:border-0 sm:bg-transparent">
                    
                    {/* Name & Phone */}
                    <td className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 border-b border-border/10 sm:border-0">
                      <span className="sm:hidden font-semibold text-muted-foreground">Name</span>
                      <div className="text-right sm:text-left flex flex-col sm:items-start items-end">
                        <div className="flex items-center gap-0.5">
                          <span className="font-medium text-foreground">{leadName}</span>
                          {leadName !== 'N/A' && <CopyButton value={leadName} />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-0.5">
                          <span>{phoneVal}</span>
                          {phoneVal !== 'No Phone' && <CopyButton value={phoneVal} />}
                        </div>
                      </div>
                    </td>

                    {/* Form */}
                    <td className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 border-b border-border/10 sm:border-0">
                      <span className="sm:hidden font-semibold text-muted-foreground">Form</span>
                      <span className="text-foreground sm:text-muted-foreground font-medium sm:font-normal">
                        {getFormName(lead.formId)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 border-b border-border/10 sm:border-0">
                      <span className="sm:hidden font-semibold text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Dynamic Key Values */}
                    {customKeys.map((key) => {
                      const value = lead.data?.[key]
                      const stringValue = value !== undefined ? String(value) : '—'
                      return (
                        <td key={key} className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 border-b border-border/10 sm:border-0">
                          <span className="sm:hidden font-semibold text-muted-foreground capitalize">{key}</span>
                          <span className="text-foreground flex items-center gap-0.5">
                            <span>{stringValue}</span>
                            {value !== undefined && stringValue !== '—' && <CopyButton value={stringValue} />}
                          </span>
                        </td>
                      )
                    })}

                    {/* Date */}
                    <td className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 border-b border-border/10 sm:border-0">
                      <span className="sm:hidden font-semibold text-muted-foreground">Date</span>
                      <span className="text-muted-foreground text-xs font-medium sm:font-normal">
                        {formatDistanceToNow(getSafeDate(lead.createdAt), { addSuffix: true })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="sm:table-cell py-3 px-4 flex justify-between items-center sm:py-3 sm:px-4 sm:border-0 sm:text-right">
                      <span className="sm:hidden font-semibold text-muted-foreground">Actions</span>
                      <div className="flex gap-1.5 justify-end items-center">
                        {/* Small Quick Mark as Done */}
                        {lead.status !== 'converted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickDoneInTable(lead)}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 p-1.5 h-8 w-8 rounded-full transition-all"
                            title="Mark as Done"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 h-8 w-8 rounded-full transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {hasPermission(Permission.EDIT) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                            className="text-muted-foreground hover:text-accent hover:bg-accent/10 p-1.5 h-8 w-8 rounded-full transition-all"
                            title="Expand Details"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        )}
                        {hasPermission(Permission.DELETE) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id)}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 h-8 w-8 rounded-full transition-all"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  {isExpanded && hasPermission(Permission.EDIT) && (
                    <tr className="border-b border-border/50 bg-muted/10 block sm:table-row">
                      <td colSpan={5 + customKeys.length} className="block sm:table-cell py-4 px-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                            Expanded Fields
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-background/50 p-3 rounded-lg border border-border/40">
                            {(() => {
                              const orderedKeys = ['name', 'phone', 'email', 'city', 'loanamount', 'loan_amount', 'amount']
                              const sortedEntries = Object.entries(lead.data || {}).sort(([keyA], [keyB]) => {
                                const lowerA = keyA.toLowerCase()
                                const lowerB = keyB.toLowerCase()
                                const idxA = orderedKeys.findIndex(k => lowerA.includes(k) || k.includes(lowerA))
                                const idxB = orderedKeys.findIndex(k => lowerB.includes(k) || k.includes(lowerB))
                                const valA = idxA === -1 ? 999 : idxA
                                const valB = idxB === -1 ? 999 : idxB
                                if (valA !== valB) return valA - valB
                                return keyA.localeCompare(keyB)
                              })
                              return sortedEntries.map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <label className="text-[10px] font-bold text-muted-foreground capitalize">
                                    {key}
                                  </label>
                                  <div className="text-foreground text-sm font-medium flex items-center gap-0.5">
                                    <span>{String(value || '—')}</span>
                                    {value !== undefined && String(value) !== '—' && (
                                      <CopyButton value={String(value)} />
                                    )}
                                  </div>
                                </div>
                              ))
                            })()}
                          </div>
                          <div className="pt-2 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-semibold px-3"
                              onClick={() => setSelectedLead(lead)}
                            >
                              Edit Full Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedId(null)}
                              className="border-border h-8 text-xs font-semibold px-3"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
