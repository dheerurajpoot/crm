'use client'

import { useState, useEffect } from 'react'
import { Lead, FormTemplate } from '@/lib/schemas'
import { updateLead, getLeadActivities } from '@/lib/firestore'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

  useEffect(() => {
    const loadActivities = async () => {
      if (!userData) return
      setLoadingActivities(true)
      try {
        const activitiesData = await getLeadActivities(userData.organizationId, lead.id)
        setActivities(activitiesData)
      } catch (error) {
        console.error('[v0] Error loading activities:', error)
      } finally {
        setLoadingActivities(false)
      }
    }

    loadActivities()
  }, [lead.id, userData])

  const handleSave = async () => {
    if (!userData || !hasPermission('edit')) return

    setSaving(true)
    try {
      await updateLead(userData.organizationId, lead.id, {
        ...editedLead,
        data: editedLead.data,
      })
      onUpdate(editedLead)
      onClose()
    } catch (error) {
      console.error('[v0] Save error:', error)
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{editedLead.data?.name || 'Lead Details'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{getFormName(editedLead.formId)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Lead Data */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Lead Information</h3>
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Status</label>
                <select
                  value={editedLead.status}
                  onChange={(e) =>
                    setEditedLead({ ...editedLead, status: e.target.value as any })
                  }
                  disabled={!hasPermission('edit')}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground disabled:opacity-50"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Lead Fields */}
              {getFormFields(editedLead.formId).map((field) => (
                <div key={field.id}>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    {field.label}
                  </label>
                  <Input
                    type={field.type}
                    value={editedLead.data?.[field.name] || ''}
                    onChange={(e) =>
                      setEditedLead({
                        ...editedLead,
                        data: {
                          ...editedLead.data,
                          [field.name]: e.target.value,
                        },
                      })
                    }
                    disabled={!hasPermission('edit')}
                    placeholder={field.placeholder}
                    className="bg-input border-border disabled:opacity-50"
                  />
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Notes</label>
                <textarea
                  value={editedLead.notes || ''}
                  onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                  disabled={!hasPermission('edit')}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground resize-none disabled:opacity-50"
                  rows={4}
                  placeholder="Add internal notes about this lead..."
                />
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Activity</h3>
            <div className="space-y-3">
              {loadingActivities ? (
                <p className="text-muted-foreground text-sm">Loading activities...</p>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground">
                        <span className="font-medium capitalize">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No activity yet</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p>Created: {new Date(editedLead.createdAt).toLocaleString()}</p>
            <p>Last updated: {new Date(editedLead.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        {hasPermission('edit') && (
          <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
