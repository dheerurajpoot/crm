'use client'

import { useState, useEffect } from 'react'
import { Lead, FormTemplate, Permission } from '@/lib/schemas'
import { updateLead, getLeadActivities, createLeadActivity } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save, CheckCircle2, ClipboardList, History, Loader2, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const getSafeDate = (value: any): Date => {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (value.seconds !== undefined) return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

interface LeadDetailModalProps {
  lead: Lead & { id: string }
  forms: (FormTemplate & { id: string })[]
  onClose: () => void
  onUpdate: (lead: Lead & { id: string }) => void
}

export default function LeadDetailModal({
  lead,
  forms,
  onClose,
  onUpdate,
}: LeadDetailModalProps) {
  const { userData, hasPermission } = useAuth()
  const [editedLead, setEditedLead] = useState(lead)
  const [saving, setSaving] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('details')

  useEffect(() => {
    const loadActivities = async () => {
      if (!userData) return
      setLoadingActivities(true)
      try {
        const activitiesData = await getLeadActivities(userData.organizationId, lead.id)
        setActivities(activitiesData)
      } catch (error) {
        console.error('[Modal] Error loading activities:', error)
      } finally {
        setLoadingActivities(false)
      }
    }

    loadActivities()
  }, [lead.id, userData])

  const handleSave = async () => {
    if (!userData || !hasPermission(Permission.EDIT)) return

    setSaving(true)
    try {
      await updateLead(userData.organizationId, lead.id, {
        ...editedLead,
        data: editedLead.data,
      })
      onUpdate(editedLead)
      onClose()
    } catch (error) {
      console.error('[Modal] Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsDone = async () => {
    if (!userData || !hasPermission(Permission.EDIT)) return

    setSaving(true)
    try {
      const updated = {
        ...editedLead,
        status: 'converted' as const,
      }
      
      // Update DB
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
          changes: { status: 'converted', note: 'Marked lead as Converted (Quick Done)' },
        })
        
        // Reload activities
        const activitiesData = await getLeadActivities(userData.organizationId, lead.id)
        setActivities(activitiesData)
      } catch (actErr) {
        console.error('[Modal] Failed to log activity:', actErr)
      }

      setEditedLead(updated)
      onUpdate(updated)
    } catch (error) {
      console.error('[Modal] Quick Done error:', error)
    } finally {
      setSaving(false)
    }
  }

  const getFormName = (formId: string) => {
    return forms.find((f) => f.id === formId)?.name || 'Unknown Form'
  }

  const getFormFields = (formId: string) => {
    return forms.find((f) => f.id === formId)?.fields || []
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
      case 'contacted':
        return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30'
      case 'qualified':
        return 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30'
      case 'converted':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30'
      case 'lost':
        return 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-350">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800 dark:text-foreground">
                {(editedLead.data?.name as string) || 'Lead Details'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(editedLead.status)}`}>
                {editedLead.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{getFormName(editedLead.formId)}</p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {editedLead.status !== 'converted' && hasPermission(Permission.EDIT) && (
              <Button
                onClick={handleMarkAsDone}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs font-semibold px-4 shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Mark as Done
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-slate-800 dark:hover:text-foreground h-9 w-9 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex border-b border-slate-100 dark:border-slate-900/40 px-6 bg-slate-50/20 dark:bg-slate-900/5">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Lead Details
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'activities'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Activity Log
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Fields Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground border-b border-slate-100 dark:border-border/30 pb-2">
                  Contact & Form Data
                </h3>
                <div className="space-y-3.5">
                  {getFormFields(editedLead.formId).map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">
                        {field.label}
                      </label>
                      <Input
                        type={field.type}
                        value={(editedLead.data?.[field.name] as string) || ''}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            data: {
                              ...editedLead.data,
                              [field.name]: e.target.value,
                            },
                          })
                        }
                        disabled={!hasPermission(Permission.EDIT)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm h-10 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-70"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CRM Options Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground border-b border-slate-100 dark:border-border/30 pb-2">
                  CRM Status & Notes
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">Status</label>
                    <select
                      value={editedLead.status}
                      onChange={(e) =>
                        setEditedLead({ ...editedLead, status: e.target.value as any })
                      }
                      disabled={!hasPermission(Permission.EDIT)}
                      className="w-full h-10 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-70"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">Internal Notes</label>
                    <textarea
                      value={editedLead.notes || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                      disabled={!hasPermission(Permission.EDIT)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[140px] transition-all disabled:opacity-70"
                      placeholder="Enter internal sales notes, follow-up calls updates..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Timeline Activity Section */
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground border-b border-slate-100 dark:border-border/30 pb-2">
                History & Audits
              </h3>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Loading audit logs...
                </div>
              ) : activities.length > 0 ? (
                <div className="relative border-l border-slate-150 dark:border-border/60 ml-3 pl-6 space-y-6 py-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative text-sm">
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-background border-2 border-primary flex items-center justify-center shadow-sm" />
                      <div className="space-y-1">
                        <p className="text-slate-800 dark:text-foreground font-semibold">
                          <span className="capitalize">{activity.action.replace('_', ' ')}</span>
                          {activity.changes?.note && (
                            <span className="text-muted-foreground font-normal ml-1.5">— {activity.changes.note}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(getSafeDate(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No activity log trace exists for this lead yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-900/40 bg-slate-50/50 dark:bg-slate-900/5 flex flex-wrap justify-between items-center text-[10px] font-bold text-slate-400 dark:text-muted-foreground gap-2">
          <span>CREATED: {getSafeDate(editedLead.createdAt).toLocaleString()}</span>
          <span>LAST UPDATED: {getSafeDate(editedLead.updatedAt).toLocaleString()}</span>
        </div>

        {/* Footer Actions */}
        {hasPermission(Permission.EDIT) && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3 justify-end sticky bottom-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-foreground dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
