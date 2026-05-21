'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getFormTemplate, getLeads } from '@/lib/firestore'
import { FormTemplate, Lead } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit2, Copy, Eye, FileText } from 'lucide-react'
import { query, where, orderBy } from 'firebase/firestore'

export default function FormViewPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const formId = params.id as string

  const [form, setForm] = useState<FormTemplate & { id: string } | null>(null)
  const [submissionsCount, setSubmissionsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadForm = async () => {
      if (!userData) return

      try {
        const formData = await getFormTemplate(userData.organizationId, formId)
        setForm(formData)

        // Count submissions
        const leads = await getLeads(userData.organizationId, [])
        const count = leads.filter((l) => l.formId === formId).length
        setSubmissionsCount(count)
      } catch (error) {
        console.error('[v0] Error loading form:', error)
        router.push('/dashboard/forms')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [userData, formId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-border bg-card max-w-md w-full mx-4">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Form not found</h3>
              <p className="text-muted-foreground">
                The form you&apos;re looking for doesn&apos;t exist
              </p>
              <Link href="/dashboard/forms" className="block mt-4">
                <Button variant="outline" className="border-border">
                  Back to Forms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/forms">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">{form.name}</h1>
            </div>
            {form.description && (
              <p className="text-muted-foreground ml-12">{form.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/forms/${form.id}/edit`}>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{submissionsCount}</div>
              <p className="text-sm text-muted-foreground mt-2">Total Submissions</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{form.fields.length}</div>
              <p className="text-sm text-muted-foreground mt-2">Form Fields</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                form.isActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {form.isActive ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-muted-foreground mt-3">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Form Fields */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {index + 1}. {field.label}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: <span className="capitalize font-mono text-xs">{field.type}</span>
                      </p>
                      {field.placeholder && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Placeholder: {field.placeholder}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {field.required && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Form Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/dashboard/leads?formId=${form.id}`} className="block">
              <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Eye className="w-5 h-5" />
                View Submissions
              </Button>
            </Link>
            <Link href={`/dashboard/forms/${form.id}/edit`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 border-border">
                <Edit2 className="w-5 h-5" />
                Edit Form
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2 border-border">
              <Copy className="w-5 h-5" />
              Copy Form Link
            </Button>
          </CardContent>
        </Card>

        {/* Form Info */}
        <Card className="border-border bg-muted/30">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div>
              <span className="font-medium text-foreground">Form ID:</span>
              <span className="text-muted-foreground ml-2 font-mono text-xs">{form.id}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Created:</span>
              <span className="text-muted-foreground ml-2">
                {new Date(form.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-foreground">Last Updated:</span>
              <span className="text-muted-foreground ml-2">
                {new Date(form.updatedAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
