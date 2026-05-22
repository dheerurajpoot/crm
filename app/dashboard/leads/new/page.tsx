'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getFormTemplates, createLead, createLeadActivity } from '@/lib/firestore'
import { FormTemplate, Permission } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function NewLeadPage() {
  const { userData } = useAuth()
  const router = useRouter()
  const [forms, setForms] = useState<(FormTemplate & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedFormId, setSelectedFormId] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'new' | 'contacted' | 'qualified' | 'converted' | 'lost'>('new')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadForms = async () => {
      if (!userData) return
      try {
        const formsData = await getFormTemplates(userData.organizationId)
        setForms(formsData)
        if (formsData.length > 0) {
          setSelectedFormId(formsData[0].id)
        }
      } catch (err) {
        console.error('[NewLead] Error loading forms:', err)
      } finally {
        setLoading(false)
      }
    }
    loadForms()
  }, [userData])

  // Get fields of the selected form
  const selectedForm = forms.find(f => f.id === selectedFormId)
  const fields = selectedForm?.fields || []

  // Initialize fields on form change
  useEffect(() => {
    if (selectedForm) {
      const initialData: Record<string, string> = {}
      selectedForm.fields.forEach(f => {
        initialData[f.name] = ''
      })
      setFormData(initialData)
    }
  }, [selectedFormId, forms, selectedForm])

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return
    if (!selectedFormId) {
      setError('Please select a form template')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const leadId = await createLead(userData.organizationId, {
        formId: selectedFormId,
        formName: selectedForm?.name || 'Manual Lead',
        organizationId: userData.organizationId,
        status,
        data: formData,
        notes,
        createdBy: userData.uid
      })

      // Log Lead Activity
      try {
        await createLeadActivity(userData.organizationId, {
          leadId,
          organizationId: userData.organizationId,
          userId: userData.uid,
          action: 'created',
          changes: { note: 'Lead created manually' }
        })
      } catch (actErr) {
        console.error('[NewLead] Failed to log activity:', actErr)
      }

      router.push('/dashboard/leads')
    } catch (err: any) {
      console.error('[NewLead] Submit error:', err)
      setError(err.message || 'Failed to create lead')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 mb-20 md:mb-0">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-medium text-muted-foreground">Back to Leads</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Lead</h1>
          <p className="text-muted-foreground mt-2">Manually create a new lead in your CRM database.</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
            <CardDescription>Select a form template and fill in the lead information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Form Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Form Template</label>
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option value="" disabled>Select a form...</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamically Rendered Form Fields */}
              {fields.length > 0 && (
                <div className="space-y-4 border-t border-border/40 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Fields Data</h3>
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <Input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        className="bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm h-10 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* CRM Options */}
              <div className="space-y-4 border-t border-border/40 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CRM Information</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-50/50 focus:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/40 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground text-sm resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[100px] transition-all"
                    placeholder="Enter sales notes or description..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end border-t border-border/40 pt-4">
                <Link href="/dashboard/leads">
                  <Button variant="outline" className="border-border">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[120px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Lead
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
