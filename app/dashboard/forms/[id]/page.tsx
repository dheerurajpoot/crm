'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getFormTemplate, getLeads } from '@/lib/firestore'
import { FormTemplate } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Edit2, Copy, Eye, FileText, Check, Sparkles, Monitor, Smartphone, Code, Sliders, CheckCircle2, Loader2 } from 'lucide-react'

export default function FormViewPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const formId = params.id as string

  const [form, setForm] = useState<FormTemplate & { id: string } | null>(null)
  const [submissionsCount, setSubmissionsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Customization States
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [bgTransparent, setBgTransparent] = useState<boolean>(false)
  const [accentColor, setAccentColor] = useState<string>('#3b82f6')
  const [roundedCorners, setRoundedCorners] = useState<'none' | 'sm' | 'md' | 'lg' | 'full'>('md')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')

  // Copy states
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  
  // Interactive Preview States
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({})
  const [previewSubmitted, setPreviewSubmitted] = useState(false)
  const [previewSubmitting, setPreviewSubmitting] = useState(false)

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

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

        // Initialize preview values
        if (formData) {
          const init: Record<string, string> = {}
          formData.fields.forEach((field) => {
            init[field.name] = ''
          })
          setPreviewValues(init)
        }
      } catch (error) {
        console.error('[Forms Detail] Error loading form:', error)
        router.push('/dashboard/forms')
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [userData, formId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading form details...</p>
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

  // Predefined accent colors
  const accentColors = [
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
    { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
    { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
    { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  ]

  // Direct public link and iframe embed code
  const publicLink = `${origin}/f/${userData?.organizationId}/${form.id}?theme=${theme}&bg=${bgTransparent ? 'transparent' : 'normal'}&accent=${encodeURIComponent(accentColor)}&rounded=${roundedCorners}`
  
  const embedCode = `<iframe 
  src="${publicLink}" 
  width="100%" 
  height="600" 
  style="border:none; background:transparent;" 
  loading="lazy"
></iframe>`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  // Interactive Form Preview submission handler (simulated)
  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple mock validation
    const errors: Record<string, string> = {}
    form.fields.forEach((field) => {
      const val = previewValues[field.name]?.trim()
      if (field.required && !val) {
        errors[field.name] = `${field.label} is required`
      } else if (val) {
        if (field.type === 'email' && !/\S+@\S+\.\S+/.test(val)) {
          errors[field.name] = 'Invalid email format'
        }
      }
    })

    setPreviewErrors(errors)
    if (Object.keys(errors).length > 0) return

    setPreviewSubmitting(true)
    setTimeout(() => {
      setPreviewSubmitting(false)
      setPreviewSubmitted(true)
    }, 1000)
  }

  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[roundedCorners] || 'rounded-md'

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/forms">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{form.name}</h1>
            </div>
            {form.description && (
              <p className="text-muted-foreground ml-11 text-sm">{form.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-11 md:ml-0">
            <Link href={`/dashboard/leads?formId=${form.id}`}>
              <Button variant="outline" className="border-border text-foreground gap-2">
                <Eye className="w-4 h-4" />
                Submissions
              </Button>
            </Link>
            <Link href={`/dashboard/forms/${form.id}/edit`}>
              {/* Wait, editing is not built yet but we can direct them or let it render if they build it */}
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Form
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{submissionsCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Submissions</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{form.fields.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Form Fields</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardContent className="pt-6">
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                form.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {form.isActive ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Form Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Control */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/80 p-1 border border-border/40">
            <TabsTrigger value="overview">Overview & Fields</TabsTrigger>
            <TabsTrigger value="design">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Design & Preview
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Code className="w-3.5 h-3.5 mr-1" />
              Share & Embed
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Form Fields Config</CardTitle>
                <CardDescription>The database structure and input validation guidelines for this form.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {form.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field, idx) => (
                      <div key={field.id} className="p-4 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {field.label}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span>Key: <code className="font-mono text-white bg-slate-800 px-1 rounded">{field.name}</code></span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="capitalize">Type: {field.type}</span>
                            {field.placeholder && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span>Placeholder: &ldquo;{field.placeholder}&rdquo;</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 self-start sm:self-center">
                          {field.required && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                              Required
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                            Order {field.order}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design & Preview Tab Content */}
          <TabsContent value="design" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Styles Control Panel */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-primary" />
                      Form Styles Customizer
                    </CardTitle>
                    <CardDescription>Modify form appearance parameters for your website landing page.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {/* Theme selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          onClick={() => setTheme('dark')}
                          className="w-full text-xs"
                        >
                          Dark Theme
                        </Button>
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          onClick={() => setTheme('light')}
                          className="w-full text-xs"
                        >
                          Light Theme
                        </Button>
                      </div>
                    </div>

                    {/* Background Transparent */}
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/10">
                      <div className="space-y-0.5">
                        <label htmlFor="bg-trans" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block cursor-pointer">Transparent BG</label>
                        <span className="text-[10px] text-muted-foreground">Remove wrapper borders & backgrounds.</span>
                      </div>
                      <input
                        type="checkbox"
                        id="bg-trans"
                        checked={bgTransparent}
                        onChange={(e) => setBgTransparent(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-border bg-slate-900 accent-primary"
                      />
                    </div>

                    {/* Predefined / Custom Accents */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent & Focus Color</label>
                      <div className="flex flex-wrap gap-2">
                        {accentColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setAccentColor(color.value)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${color.bg} ${
                              accentColor === color.value 
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-950 scale-110 border-white' 
                                : 'border-transparent opacity-85 hover:opacity-100'
                            }`}
                            title={color.name}
                          >
                            {accentColor === color.value && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1.5">
                        <span className="text-[10px] text-muted-foreground font-mono">Custom hex:</span>
                        <Input
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="h-7 text-xs bg-slate-950/50 border-border text-foreground font-mono w-24 px-2"
                        />
                      </div>
                    </div>

                    {/* Rounded corners */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Border Roundness</label>
                      <select
                        value={roundedCorners}
                        onChange={(e) => setRoundedCorners(e.target.value as any)}
                        className="w-full h-8 px-2.5 rounded bg-slate-950/60 border border-border text-xs text-foreground outline-none"
                      >
                        <option value="none">Square (none)</option>
                        <option value="sm">Small (sm)</option>
                        <option value="md">Medium (md)</option>
                        <option value="lg">Large (lg)</option>
                        <option value="xl">Extra Large (xl)</option>
                        <option value="full">Pill (full)</option>
                      </select>
                    </div>

                    {/* Mockup Device Toggle */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview Frame</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
                          onClick={() => setDeviceMode('desktop')}
                          className="w-full text-xs gap-1.5 h-8"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          Desktop view
                        </Button>
                        <Button
                          variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
                          onClick={() => setDeviceMode('mobile')}
                          className="w-full text-xs gap-1.5 h-8"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Mobile view
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Live Mockup Frame */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Mockup Preview</span>
                  <span className="text-[10px] text-muted-foreground">Simulated render of customizations. No data is stored on preview submit.</span>
                </div>

                {deviceMode === 'mobile' ? (
                  /* Smartphone frame container */
                  <div className="mx-auto max-w-[340px] border-[10px] border-slate-800 rounded-[36px] overflow-hidden bg-slate-950 shadow-2xl relative transition-all duration-300">
                    <div className="h-6 w-full bg-slate-800 flex items-center justify-center relative">
                      <div className="w-16 h-3.5 rounded-full bg-slate-950" />
                    </div>
                    <div className={`p-4 h-[480px] overflow-y-auto ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
                      {renderMockupForm()}
                    </div>
                  </div>
                ) : (
                  /* Browser window container */
                  <div className="border border-border rounded-lg overflow-hidden bg-slate-950 shadow-2xl transition-all duration-300">
                    <div className="bg-slate-900/90 px-4 py-2.5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      </div>
                      <div className="bg-slate-950/80 border border-border/20 text-[10px] text-muted-foreground px-3 py-1 rounded w-80 text-center font-mono truncate">
                        {publicLink.substring(0, 60)}...
                      </div>
                      <div className="w-12"></div>
                    </div>
                    <div className={`p-8 h-[460px] overflow-y-auto ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
                      <div className="max-w-md mx-auto">
                        {renderMockupForm()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </TabsContent>

          {/* Share & Embed Tab Content */}
          <TabsContent value="embed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Direct Links & IFrame Embed */}
              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Direct Sharing Link</CardTitle>
                    <CardDescription>Send this URL directly to leads or link to it in emails.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={publicLink}
                        readOnly
                        className="bg-slate-950/50 border-border text-foreground font-mono text-xs select-all"
                      />
                      <Button
                        onClick={handleCopyLink}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      Open form in new window
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">IFrame Embed Code</CardTitle>
                    <CardDescription>Paste this HTML block inside your page builder (WordPress, Webflow, Shopify, custom HTML).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-border text-xs font-mono text-emerald-400 whitespace-pre-wrap select-all max-h-40 overflow-y-auto">
                      {embedCode}
                    </div>
                    <Button
                      onClick={handleCopyEmbed}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                    >
                      {copiedEmbed ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Copied HTML Embed Code
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Embed Code
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Code Builder / Quick Instructions */}
              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">How to Embed in Common Builders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 text-sm text-muted-foreground leading-relaxed">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">WordPress</h4>
                      <p className="text-xs">Add a custom **HTML Widget** or block inside Elementor / Gutenberg and paste the iframe embed code.</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Webflow</h4>
                      <p className="text-xs">Add an **Embed element** inside your layout panel, paste the code, and set its height parameters to responsive.</p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">HTML/CSS Custom Landing Pages</h4>
                      <p className="text-xs">Paste the iframe tag directly inside any container div. We recommend toggling **Transparent BG** so that the form inherits the page background dynamically.</p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block mb-0.5">Quick Design Pro Tip:</span>
                        Adjust settings in the **Design & Preview** tab before copying. The link and iframe codes auto-update in real-time with custom values.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  // Sub-renderer for previewing the mock form
  function renderMockupForm() {
    if (!form) return null

    const isDarkTheme = theme === 'dark'
    const wrapperBg = bgTransparent
      ? 'bg-transparent border-0'
      : isDarkTheme
      ? 'bg-slate-900 border border-slate-800 shadow-xl'
      : 'bg-white border border-slate-200 shadow-lg'

    if (previewSubmitted) {
      return (
        <div className={`p-6 text-center space-y-4 rounded-xl ${wrapperBg} animate-in fade-in zoom-in-95 duration-200`}>
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-10 h-10" style={{ color: accentColor }} />
          </div>
          <h3 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Form submitted successfully!
          </h3>
          <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            (This is a simulated submission preview. No records were written to the database.)
          </p>
          <Button
            size="sm"
            onClick={() => {
              setPreviewSubmitted(false)
              const reset: Record<string, string> = {}
              form.fields.forEach((f) => (reset[f.name] = ''))
              setPreviewValues(reset)
              setPreviewErrors({})
            }}
            variant="outline"
            className={`${isDarkTheme ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
            style={{ borderRadius: roundedCorners === 'full' ? '9999px' : roundedCorners === 'lg' ? '8px' : roundedCorners === 'sm' ? '2px' : '4px' }}
          >
            Submit another response
          </Button>
        </div>
      )
    }

    return (
      <div className={`p-6 rounded-xl space-y-4 ${wrapperBg}`}>
        <div className="space-y-1.5 pb-2 text-center">
          <h3 className={`text-xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-950'}`}>
            {form.name}
          </h3>
          {form.description && (
            <p className={`text-xs leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              {form.description}
            </p>
          )}
        </div>

        <form onSubmit={handlePreviewSubmit} className="space-y-4">
          <div className="space-y-3.5">
            {form.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => {
                const hasError = !!previewErrors[field.name]

                return (
                  <div key={field.id} className="space-y-1.5 text-left">
                    <label
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isDarkTheme ? 'text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        readOnly
                        placeholder={field.placeholder || ''}
                        value={previewValues[field.name] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.name]: e.target.value })}
                        rows={3}
                        className={`w-full px-3 py-2 text-xs bg-transparent border outline-none resize-none transition-all ${roundedClass} ${
                          isDarkTheme
                            ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        disabled
                        value=""
                        className={`w-full h-9 px-3 py-2 text-xs bg-transparent border outline-none cursor-not-allowed ${roundedClass} ${
                          isDarkTheme
                            ? 'bg-slate-950/40 border-slate-800 text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="" disabled>
                          {field.placeholder || 'Select an option'}
                        </option>
                        {field.options?.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder || ''}
                        value={previewValues[field.name] || ''}
                        onChange={(e) => {
                          setPreviewValues({ ...previewValues, [field.name]: e.target.value })
                          if (previewErrors[field.name]) {
                            const errs = { ...previewErrors }
                            delete errs[field.name]
                            setPreviewErrors(errs)
                          }
                        }}
                        className={`w-full h-9 px-3 py-1.5 text-xs bg-transparent border outline-none transition-all ${roundedClass} ${
                          isDarkTheme
                            ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                        } ${hasError ? 'border-red-500' : ''}`}
                      />
                    )}

                    {hasError && (
                      <p className="text-[10px] text-red-500 font-medium">
                        {previewErrors[field.name]}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={previewSubmitting}
              style={{
                backgroundColor: accentColor,
                color: '#ffffff',
              }}
              className={`w-full h-9 font-semibold text-xs transition-all hover:opacity-95 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-primary/5 ${roundedClass}`}
            >
              {previewSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit inquiry'
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }
}
