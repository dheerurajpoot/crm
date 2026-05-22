'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Activity, 
  LayoutGrid, 
  Users, 
  FileSpreadsheet, 
  CheckCircle2, 
  Zap, 
  Lock, 
  TrendingUp, 
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const { currentUser, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary selection:text-primary-foreground overflow-x-hidden font-sans">
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[80vh] left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LeadFlow CRM
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#qualities" className="hover:text-white transition-colors">Qualities</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : currentUser ? (
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/20 gap-1.5">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/20">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-slate-950 border-t border-slate-900 p-6 flex flex-col justify-between animate-in slide-in-from-top duration-250">
          <nav className="flex flex-col gap-6 text-base font-semibold text-slate-400">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Features</a>
            <a href="#qualities" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Qualities</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Security</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex flex-col gap-4 mt-8 pb-12">
            {currentUser ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/95 text-white py-6 text-base font-bold shadow-lg shadow-primary/20">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-slate-800 text-slate-300 py-6 text-base font-bold hover:bg-slate-900">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white py-6 text-base font-bold shadow-lg shadow-primary/20">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800/80 text-xs text-primary font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation CRM Platform for Teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white max-w-3xl mx-auto">
            Convert Leads Into Deals{' '}
            <span className="bg-gradient-to-r from-blue-400 via-primary to-purple-400 bg-clip-text text-transparent">
              Faster Than Ever
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            LeadFlow CRM combines custom dynamic form generation, real-time lead ingestion, visual sales pipelines, and role-based agent tracking in one unified interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {currentUser ? (
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white px-8 py-6 text-base font-bold shadow-xl shadow-primary/25 gap-2 rounded-xl">
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white px-8 py-6 text-base font-bold shadow-xl shadow-primary/25 gap-2 rounded-xl">
                    Start Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 px-8 py-6 text-base font-bold rounded-xl">
                    Request Demo
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-900/60 max-w-3xl mx-auto text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">99.9%</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Uptime SLA</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">1.2M+</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Leads Ingested</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">&lt; 150ms</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Form Response</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">4.9/5</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Qualities / Key Features Grid */}
      <section id="qualities" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Core Qualities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Built for High-Growth Sales Teams</p>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              A comprehensive system crafted to eliminate spreadsheets, optimize follow-ups, and empower agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Card 1 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 w-fit text-blue-400 group-hover:scale-110 transition-transform">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Form Builder</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Design custom lead forms (loan requests, contact sheets, registrations) with custom layouts and drag-and-drop fields. Share links or embed anywhere.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/20 w-fit text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Agent Collaboration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Invite team members with detailed role profiles: Admins, Managers, and Agents. Control visibility permissions and log manual activities dynamically.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 w-fit text-emerald-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">One-Click Simple Export</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Instantly export filtered lead listings into standard un-styled Microsoft Excel spreadsheet sheets. Clean data ingestion for other platforms.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 w-fit text-amber-400 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Activity Logging</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track status updates, assignment logs, and edits in detailed historical chronological timelines for each customer query. Keep record integrity intact.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-pink-500/10 p-3.5 rounded-xl border border-pink-500/20 w-fit text-pink-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Performance Metrics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Assess response metrics, form conversion rates, qualified deal progress, and team performance directly inside the visual charts screen.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all group">
              <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-500/20 w-fit text-cyan-400 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure Workspace</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enterprise security policies restrict member visibility checks to ensure data separation. Multi-tenant architecture protects customer contacts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="space-y-4 md:w-1/2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <Lock className="w-3 h-3" />
                <span>Data Isolation Guarantee</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Security-First Infrastructure</h3>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Your client data is secure. With our newly optimized flat member-level authorization rules, organization information is fully separated. Agent accesses are scoped to organization member pools to block unauthorized access completely.
              </p>
              <div className="space-y-2 pt-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Full row-level authorization rules on Firestore</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Bypassed member permission checks for quick status updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Encrypted user invitation flow</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 w-full aspect-video bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
              <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                <span className="text-xs font-bold text-slate-400">Agent Action Logger</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">Live</span>
              </div>
              <div className="space-y-3.5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Marked Lead #9349 as done</span>
                  <span className="text-emerald-400 font-bold">10:24 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">User Dheeru invited to team</span>
                  <span className="text-primary font-bold">09:12 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Organization settings updated</span>
                  <span className="text-slate-500 font-bold">Yesterday</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-600 font-bold">
                PROCESSED BY LEADFLOW SHIELD SECURITY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">Can any agent mark a lead as done?</h4>
              <p className="text-sm text-slate-400">
                Yes! We have customized our workflow settings so every team member, regardless of editing permissions, has access to the "Mark as Done" buttons to close sales deals quickly.
              </p>
            </div>
            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">How do custom form templates collect leads?</h4>
              <p className="text-sm text-slate-400">
                Once you construct a form layout inside the CRM Dashboard, the system produces a dedicated sharing URL. Anyone filling out that web page forms has their entry recorded immediately in your database.
              </p>
            </div>
            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">Is there a limit on manual leads additions?</h4>
              <p className="text-sm text-slate-400">
                None. You can add leads manually using the "New Lead" form creator, which reads the target form template structure and saves it to Firestore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-white tracking-tight">LeadFlow CRM</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 LeadFlow CRM. Powered by secure flat firestore member structures. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
