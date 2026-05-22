'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getFormTemplates } from '@/lib/firestore'
import { FormTemplate, Permission } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Copy, Trash2, Eye } from 'lucide-react'

export default function FormsPage() {
  const { userData, hasPermission } = useAuth()
  const [forms, setForms] = useState<(FormTemplate & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadForms = async () => {
      if (!userData) return

      try {
        const formsData = await getFormTemplates(userData.organizationId)
        setForms(formsData)
      } catch (error) {
        console.error('[v0] Error loading forms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadForms()
  }, [userData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading forms...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Forms</h1>
            <p className="text-muted-foreground mt-2">
              Total: <span className="font-semibold text-foreground">{forms.length}</span> form{forms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/dashboard/forms/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-5 h-5" />
              New Form
            </Button>
          </Link>
        </div>

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <CardDescription className="mt-1">{form.fields.length} fields</CardDescription>
                    </div>
                    {form.isActive && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
                  )}

                  <div className="pt-3 border-t border-border space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Fields:</h4>
                    <ul className="text-xs text-foreground space-y-1">
                      {form.fields.slice(0, 3).map((field) => (
                        <li key={field.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {field.label}
                        </li>
                      ))}
                      {form.fields.length > 3 && (
                        <li className="text-muted-foreground">+{form.fields.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Link href={`/dashboard/forms/${form.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-border text-foreground hover:bg-muted"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    {hasPermission(Permission.EDIT) && (
                      <Link href={`/dashboard/forms/${form.id}/edit`} className="flex-1">
                        <Button className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="py-12">
              <div className="text-center">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No forms created yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first form to start collecting leads
                </p>
                <Link href="/dashboard/forms/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Create First Form
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
