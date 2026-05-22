'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getFormTemplate, updateFormTemplate, createLeadActivity } from '@/lib/firestore'
import { FormField } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditFormPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const formId = params.id as string

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadForm = async () => {
      if (!userData || !formId) return

      try {
        const formData = await getFormTemplate(userData.organizationId, formId)
        if (formData) {
          setFormName(formData.name)
          setFormDescription(formData.description || '')
          setFields(formData.fields || [])
        } else {
          setError('Form not found')
        }
      } catch (err: any) {
        console.error('[Form Editor] Failed to load form template:', err)
        setError('Failed to load form template')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [userData, formId])

  const handleAddField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: true,
      order: fields.length + 1,
    }
    setFields([...fields, newField])
  }

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const handleSave = async () => {
    if (!userData) return

    if (!formName.trim()) {
      setError('Form name is required')
      return
    }

    if (fields.length === 0) {
      setError('Add at least one field')
      return
    }

    setSaving(true)
    setError('')

    try {
      // 1. Update the form template in Firestore
      await updateFormTemplate(userData.organizationId, formId, {
        name: formName,
        description: formDescription,
        fields: fields.sort((a, b) => a.order - b.order),
      })

      // 2. Audit log activity trace
      try {
        await createLeadActivity(userData.organizationId, {
          leadId: '',
          organizationId: userData.organizationId,
          userId: userData.uid,
          action: 'updated',
          changes: { note: `Updated form configuration for: ${formName}` },
        })
      } catch (actErr) {
        console.error('[Form Editor] Failed to log activity:', actErr)
      }

      router.push(`/dashboard/forms/${formId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update form template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading form templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/forms/${formId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Edit Form</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Modify lead collection form fields and details.</p>
        </div>

        {/* Form Details */}
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Form Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Loan Application Form"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what this form is for..."
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground resize-none text-sm outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Form Fields</CardTitle>
            <Button
              onClick={handleAddField}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                {error}
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Field {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-500 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Label *
                    </label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="bg-input border-border text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                      className="w-full h-10 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="number">Number</option>
                      <option value="textarea">Textarea</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Placeholder
                  </label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                    placeholder="Help text or placeholder"
                    className="bg-input border-border text-sm"
                  />
                </div>

                {field.type === 'select' && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Options (comma-separated) *
                    </label>
                    <Input
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => handleUpdateField(field.id, { 
                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="e.g., Option 1, Option 2, Option 3"
                      className="bg-input border-border text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id={`required-${field.id}`}
                    checked={field.required}
                    onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-input accent-primary"
                  />
                  <label htmlFor={`required-${field.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                    Required Field
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
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
      </div>
    </div>
  )
}
