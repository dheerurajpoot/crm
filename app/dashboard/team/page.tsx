'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getTeamMembers, addTeamMember, removeTeamMember, getOrganization, getUser } from '@/lib/firestore'
import { UserRole, Permission } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Mail, Shield, AlertTriangle } from 'lucide-react'

interface TeamMember {
  userId: string
  role: UserRole
  permissions: Permission[]
  addedAt: string
  userEmail?: string
  userName?: string
}

export default function TeamPage() {
  const { userData, isAdmin } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingEmail, setInvitingEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState(UserRole.AGENT)
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([Permission.VIEW])
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [bootstrapInfo, setBootstrapInfo] = useState('')
  const [orgName, setOrgName] = useState('Your Organization')
  const [inviteUrlToShow, setInviteUrlToShow] = useState('')
  const [emailSentStatus, setEmailSentStatus] = useState<'sent' | 'fallback' | ''>('')

  useEffect(() => {
    const loadMembers = async () => {
      if (!userData || !isAdmin) return

      try {
        const [membersData, orgDoc] = await Promise.all([
          getTeamMembers(userData.organizationId),
          getOrganization(userData.organizationId)
        ])

        if (orgDoc) {
          setOrgName(orgDoc.name)
        }

        // Self-healing bootstrap check:
        // Ensure that the current admin's UID document exists in the subcollection organizations/{orgId}/members/{uid}.
        // If not present (e.g. from legacy accounts created without members document), write it here to self-heal.
        const currentAdminInSubcollection = membersData.some((m: any) => m.userId === userData.uid)
        if (!currentAdminInSubcollection) {
          console.warn('[Team] Self-healing bootstrap: Admin member record missing in organizations. Repairing...')
          try {
            await addTeamMember(userData.organizationId, userData.uid, userData.role, userData.permissions)
            // Re-fetch members to verify
            const freshMembers = await getTeamMembers(userData.organizationId)
            membersData.splice(0, membersData.length, ...freshMembers)
            setBootstrapInfo('Admin permissions successfully repaired & synced in Firestore subcollections.')
          } catch (repairErr) {
            console.error('[Team] Failed to self-heal admin member record:', repairErr)
          }
        }

        // Load user details for each member
        const membersWithDetails: TeamMember[] = await Promise.all(
          membersData.map(async (m: any) => {
            const member = m as any
            let user = null
            
            // If member.userId is an email, it's a pending invitation and has no /users document
            if (member.userId && !member.userId.includes('@')) {
              try {
                user = await getUser(member.userId)
              } catch (userErr) {
                console.warn(`[Team] Failed to load details for user ID ${member.userId}:`, userErr)
              }
            }

            return {
              userId: member.userId,
              role: (member.role || UserRole.AGENT) as UserRole,
              permissions: (member.permissions || [Permission.VIEW]) as Permission[],
              addedAt: member.addedAt
                ? (typeof member.addedAt.toDate === 'function'
                    ? member.addedAt.toDate().toISOString()
                    : String(member.addedAt))
                : new Date().toISOString(),
              userEmail: user?.email || member.userId,
              userName: user?.displayName || 'Pending User Invite',
            }
          })
        )

        setMembers(membersWithDetails)
      } catch (err) {
        console.error('[Team] Error loading team members:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [userData, isAdmin])

  const handleInvite = async () => {
    if (!userData || !isAdmin) return
    if (!invitingEmail.trim()) {
      setError('Email is required')
      return
    }

    setInviting(true)
    setError('')

    try {
      // Create team member with pending status using the email as document ID
      await addTeamMember(userData.organizationId, invitingEmail, selectedRole, selectedPermissions)

      const inviteUrl = `${window.location.origin}/signup?orgId=${userData.organizationId}&email=${encodeURIComponent(invitingEmail)}&role=${selectedRole}&permissions=${encodeURIComponent(JSON.stringify(selectedPermissions))}`
      
      try {
        const inviteResponse = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: invitingEmail,
            orgName,
            inviteUrl,
          }),
        })
        if (inviteResponse.ok) {
          setEmailSentStatus('sent')
        } else {
          setEmailSentStatus('fallback')
        }
      } catch (e) {
        setEmailSentStatus('fallback')
      }

      setInviteUrlToShow(inviteUrl)

      setMembers([
        ...members,
        {
          userId: invitingEmail,
          role: selectedRole,
          permissions: selectedPermissions,
          addedAt: new Date().toISOString(),
          userEmail: invitingEmail,
          userName: 'Pending User Invite',
        },
      ])

      setInvitingEmail('')
      setSelectedRole(UserRole.AGENT)
      setSelectedPermissions([Permission.VIEW])
    } catch (err: any) {
      setError(
        err.message?.includes('permission')
          ? "Permission Denied: Your admin user account is missing Firestore credentials. Try refreshing this page to run self-healing, or check SETUP.md to update your database rules."
          : err.message || 'Failed to invite member'
      )
    } finally {
      setInviting(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!userData || !isAdmin) return
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      await removeTeamMember(userData.organizationId, memberId)
      setMembers(members.filter((m) => m.userId !== memberId))
    } catch (err: any) {
      setError(err.message || 'Failed to remove member')
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-border bg-card max-w-md w-full mx-4">
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground">
                Only administrators can manage team members
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 mb-20 md:mb-0">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their permissions
          </p>
        </div>

        {/* Bootstrap Status Notice */}
        {bootstrapInfo && (
          <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
            <Shield className="w-4 h-4" />
            {bootstrapInfo}
          </div>
        )}
        {inviteUrlToShow && (
          <Card className="border-border bg-emerald-500/[0.02] border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {emailSentStatus === 'sent' ? 'Invitation Sent Successfully!' : 'Invitation Created (Manual Link Copy)'}
              </CardTitle>
              <CardDescription>
                {emailSentStatus === 'sent'
                  ? `An email invitation was dispatched to the user. The user can register using that link.`
                  : `We saved the member in the database, but we could not send a real email (this usually occurs on Resend sandbox/onboarding keys if the recipient email domain is not verified). Please copy the link below and send it to them manually:`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                <input
                  type="text"
                  readOnly
                  value={inviteUrlToShow}
                  className="bg-transparent border-0 text-xs font-mono w-full text-foreground outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrlToShow)
                    alert('Copied to clipboard!')
                  }}
                  className="bg-background text-xs"
                >
                  Copy
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteUrlToShow('')}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Dismiss Notice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invite Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>Add new team members and set their permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold flex items-start gap-2 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="email"
                  placeholder="team@example.com"
                  value={invitingEmail}
                  onChange={(e) => setInvitingEmail(e.target.value)}
                  className="bg-muted/40 focus:bg-background border-border text-foreground text-sm h-10"
                />

                <select
                  value={selectedRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole
                    setSelectedRole(role)
                    if (role === UserRole.ADMIN) {
                      setSelectedPermissions([Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.EXPORT])
                    } else if (role === UserRole.MANAGER) {
                      setSelectedPermissions([Permission.VIEW, Permission.EDIT, Permission.EXPORT])
                    } else if (role === UserRole.AGENT) {
                      setSelectedPermissions([Permission.VIEW, Permission.EDIT])
                    } else if (role === UserRole.VIEWER) {
                      setSelectedPermissions([Permission.VIEW])
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-muted/40 border border-border text-foreground text-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.AGENT}>Agent</option>
                  <option value={UserRole.VIEWER}>Viewer</option>
                </select>

                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10"
                >
                  <Plus className="w-4 h-4" />
                  {inviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">
                  Granular Permissions
                </label>
                <div className="flex flex-wrap gap-4">
                  {[Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.EXPORT].map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm])
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((p) => p !== perm)
                            )
                          }
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground capitalize font-medium">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Team Members 
              <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {members.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="p-4 rounded-xl border border-border/60 flex items-center justify-between hover:border-primary/40 hover:bg-slate-50/[0.02] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="truncate">
                          <h4 className="font-semibold text-foreground truncate">{member.userName || member.userEmail}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {member.userEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground capitalize">
                          {member.role}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.userId)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 h-8 w-8 rounded-full"
                          title="Remove Team Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No team members yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-Based Access Control Guide */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Role-Based Access Control (RBAC) Guide
            </CardTitle>
            <CardDescription>
              Understand LeadFlow CRM user roles, permissions, and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Admin */}
              <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <h4 className="font-bold text-foreground">Admin</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full owner credentials. Manage configurations, settings, security logs, and team members.
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Permissions</span>
                  <div className="flex flex-wrap gap-1">
                    {['View', 'Edit', 'Delete', 'Export'].map((p) => (
                      <span key={p} className="text-[9px] font-semibold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Manager */}
              <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h4 className="font-bold text-foreground">Manager</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Operations supervisor. Can read/write lead databases, review custom attributes, and export reports.
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Permissions</span>
                  <div className="flex flex-wrap gap-1">
                    {['View', 'Edit', 'Export'].map((p) => (
                      <span key={p} className="text-[9px] font-semibold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent */}
              <div className="p-4 rounded-xl border border-green-500/10 bg-green-500/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <h4 className="font-bold text-foreground">Agent</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fulfillment representative. Can edit status tags and follow up on customer communications.
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Permissions</span>
                  <div className="flex flex-wrap gap-1">
                    {['View', 'Edit'].map((p) => (
                      <span key={p} className="text-[9px] font-semibold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Viewer */}
              <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h4 className="font-bold text-foreground">Viewer</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auditor/Observer. Full read-only dashboard review. Cannot update databases or settings.
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Permissions</span>
                  <div className="flex flex-wrap gap-1">
                    {['View'].map((p) => (
                      <span key={p} className="text-[9px] font-semibold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
