'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getFormTemplate, createLead, createLeadActivity, getLeads } from '@/lib/firestore'
import { where } from 'firebase/firestore'
import { FormTemplate, FormField } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

function PublicFormContent() {
  const params = useParams()
  const searchParams = useSearchParams()

  const orgId = params.orgId as string
  const formId = params.formId as string

  // Query parameters for custom styles
  const theme = searchParams.get('theme') || 'dark' // 'light' or 'dark'
  const bg = searchParams.get('bg') || 'normal' // 'normal' or 'transparent'
  const accent = searchParams.get('accent') || '#3b82f6' // hex code
  const rounded = searchParams.get('rounded') || 'md' // 'none', 'sm', 'md', 'lg', 'full'

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  // Form field values and validation errors
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    const loadFormTemplate = async () => {
      if (!orgId || !formId) return
      try {
        const data = await getFormTemplate(orgId, formId)
        if (data) {
          setForm(data)
          // Initialize empty values
          const initialValues: Record<string, string> = {}
          data.fields.forEach((field) => {
            initialValues[field.name] = ''
          })
          setValues(initialValues)
        } else {
          setError('Form not found or has been disabled')
        }
      } catch (err) {
        console.error('[Public Form] Error loading form:', err)
        setError('Unable to load form. Please check the URL or try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadFormTemplate()
  }, [orgId, formId])

  const handleInputChange = (fieldName: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    // Clear validation error when user types
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  const validate = (): boolean => {
    if (!form) return false
    const errors: Record<string, string> = {}

    form.fields.forEach((field) => {
      const val = values[field.name]?.trim()

      if (field.required && !val) {
        errors[field.name] = `${field.label} is required`
      } else if (val) {
        if (field.type === 'email' && !/\S+@\S+\.\S+/.test(val)) {
          errors[field.name] = 'Please enter a valid email address'
        } else if (field.type === 'phone' && !/^\+?[0-9\s-]{7,15}$/.test(val)) {
          errors[field.name] = 'Please enter a valid phone number'
        }
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || submitting) return

    if (!validate()) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Check duplicate submission by phone number if a phone field is present
      const phoneField = form.fields.find((f) => f.type === 'phone')
      if (phoneField) {
        const phoneNumber = values[phoneField.name]?.trim()
        if (phoneNumber) {
          const existingLeads = await getLeads(orgId, [
            where('formId', '==', form.id),
            where(`data.${phoneField.name}`, '==', phoneNumber),
          ])

          if (existingLeads.length > 0) {
            setError('You have already submitted a response for this form.')
            setSubmitting(false)
            return
          }
        }
      }

      // 1. Submit lead to Firestore
      const leadId = await createLead(orgId, {
        organizationId: orgId,
        formId: form.id,
        formName: form.name,
        source: 'Public Embed',
        data: values,
        status: 'new',
        createdBy: 'public_form',
      })

      // 2. Log activity audit log
      try {
        await createLeadActivity(orgId, {
          leadId,
          organizationId: orgId,
          userId: 'public_form',
          action: 'created',
          changes: { note: `Submitted via public form: ${form.name}` },
        })
      } catch (actErr) {
        console.error('[Public Form] Failed to create lead activity log:', actErr)
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('[Public Form] Submission error:', err)
      setError(err.message || 'Failed to submit form. Please check your network and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Styles map
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-md'

  const isDark = theme === 'dark'
  const isTransparent = bg === 'transparent'

  // Outer page styles
  const pageBgClass = isTransparent
    ? 'bg-transparent'
    : isDark
    ? 'bg-slate-950 text-slate-100 min-h-screen'
    : 'bg-slate-50 text-slate-900 min-h-screen'

  // Card wrapper styles
  const cardClass = isTransparent
    ? 'border-0 bg-transparent shadow-none w-full p-0'
    : isDark
    ? 'border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl w-full max-w-lg mx-auto border'
    : 'border-slate-200 bg-white shadow-xl w-full max-w-lg mx-auto border'

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[350px] ${pageBgClass}`}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" style={{ color: accent }} />
          <p className={isDark ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className={`flex items-center justify-center min-h-[350px] p-6 ${pageBgClass}`}>
        <div className={`p-6 text-center max-w-md border ${roundedClass} ${
          isDark 
            ? 'bg-slate-900/80 border-red-500/20 text-slate-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Form</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className={`flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 ${pageBgClass}`}>
      <Card className={cardClass}>
        {(form.name || form.description) && (
          <CardHeader className={`space-y-1.5 pb-6 text-center ${isTransparent ? 'p-0 mb-4' : ''}`}>
            <CardTitle className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {form.name}
            </CardTitle>
            {form.description && (
              <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className={isTransparent ? 'p-0' : 'pt-0 pb-6'}>
          {submitted ? (
            <div className="text-center py-8 px-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="w-12 h-12" style={{ color: accent }} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Application has been submitted successfully!
              </h3>
              <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Thank you for submitting your application. Our team will get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`p-3 rounded-md flex items-start gap-2.5 text-sm ${
                  isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {form.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => {
                    const hasError = !!fieldErrors[field.name]
                    const isFocused = focusedField === field.id

                    // Generate custom focus styling inline
                    const focusStyle = isFocused
                      ? {
                          borderColor: accent,
                          boxShadow: `0 0 0 2px ${accent}25`,
                        }
                      : {}

                    return (
                      <div key={field.id} className="space-y-1.5">
                        <label
                          htmlFor={field.id}
                          className={`text-xs font-semibold uppercase tracking-wider block ${
                            isDark ? 'text-slate-400' : 'text-slate-700'
                          }`}
                        >
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            name={field.name}
                            value={values[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            onFocus={() => setFocusedField(field.id)}
                            onBlur={() => setFocusedField(null)}
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            rows={4}
                            style={focusStyle}
                            className={`w-full px-3 py-2 text-sm bg-transparent border outline-none transition-all resize-none ${roundedClass} ${
                              isDark
                                ? 'bg-slate-900/30 border-slate-800 text-white placeholder-slate-600 focus:bg-slate-900/50'
                                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                            } ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-0' : ''}`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            id={field.id}
                            name={field.name}
                            value={values[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            onFocus={() => setFocusedField(field.id)}
                            onBlur={() => setFocusedField(null)}
                            required={field.required}
                            style={focusStyle}
                            className={`w-full h-10 px-3 py-2 text-sm bg-transparent border outline-none transition-all cursor-pointer ${roundedClass} ${
                              isDark
                                ? 'bg-slate-900/30 border-slate-800 text-white focus:bg-slate-900/50'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                            } ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-0' : ''}`}
                          >
                            <option value="" disabled className={isDark ? 'bg-slate-950 text-slate-500' : 'bg-white text-slate-400'}>
                              {field.placeholder || 'Select an option'}
                            </option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            id={field.id}
                            name={field.name}
                            type={
                              field.type === 'phone'
                                ? 'tel'
                                : field.type === 'number'
                                ? 'number'
                                : field.type === 'email'
                                ? 'email'
                                : field.type === 'date'
                                ? 'date'
                                : 'text'
                            }
                            value={values[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            onFocus={() => setFocusedField(field.id)}
                            onBlur={() => setFocusedField(null)}
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            style={focusStyle}
                            className={`h-10 px-3 py-2 text-sm bg-transparent border outline-none transition-all ${roundedClass} ${
                              isDark
                                ? 'bg-slate-900/30 border-slate-800 text-white focus:bg-slate-900/50'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                            } ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-0' : ''}`}
                          />
                        )}

                        {hasError && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors[field.name]}
                          </p>
                        )}
                      </div>
                    )
                  })}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: accent,
                    color: '#ffffff',
                  }}
                  className={`w-full h-10 font-semibold text-sm transition-all hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 ${roundedClass} disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/10`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Subtle branding watermark */}
      <div className="text-center mt-6">
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-40 hover:opacity-75 transition-opacity ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <span>Powered by</span>
          <span className="font-bold text-primary" style={{ color: accent }}>LeadFlow CRM</span>
        </a>
      </div>
    </div>
  )
}

export default function PublicFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-slate-400 text-sm">Loading form...</p>
        </div>
      </div>
    }>
      <PublicFormContent />
    </Suspense>
  )
}
