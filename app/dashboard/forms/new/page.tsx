'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createFormTemplate } from '@/lib/firestore'
import { FormField } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Save, X } from 'lucide-react'

const DEFAULT_FIELDS: FormField[] = [
  {
    id: '1',
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    order: 1,
  },
  {
    id: '2',
    name: 'phone',
    label: 'Phone',
    type: 'phone',
    required: true,
    order: 2,
  },
  {
    id: '3',
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    order: 3,
  },
  {
    id: '4',
    name: 'city',
    label: 'City',
    type: 'text',
    required: true,
    order: 4,
  },
  {
    id: '5',
    name: 'loanAmount',
    label: 'Loan Amount',
    type: 'number',
    required: true,
    order: 5,
  },
]

export default function NewFormPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      const formId = await createFormTemplate(userData.organizationId, {
        name: formName,
        description: formDescription,
        organizationId: userData.organizationId,
        createdById: userData.uid,
        fields: fields.sort((a, b) => a.order - b.order),
        isActive: true,
      })

      router.push(`/dashboard/forms/${formId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Form</h1>
          <p className="text-muted-foreground mt-2">Design your lead collection form</p>
        </div>

        {/* Form Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Form Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Loan Application Form"
                className="bg-input border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what this form is for..."
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card className="border-border bg-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <Button
              onClick={handleAddField}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                {error}
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Field {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
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
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm"
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
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Placeholder
                  </label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                    placeholder="Help text or placeholder"
                    className="bg-input border-border text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id={`required-${field.id}`}
                    checked={field.required}
                    onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor={`required-${field.id}`} className="text-sm text-foreground cursor-pointer">
                    Required field
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create Form'}
          </Button>
        </div>
      </div>
    </div>
  )
}
