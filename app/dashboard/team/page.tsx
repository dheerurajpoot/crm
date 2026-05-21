'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getTeamMembers, addTeamMember, removeTeamMember, updateTeamMemberPermissions } from '@/lib/firestore'
import { getUser } from '@/lib/firestore'
import { UserRole, Permission } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Mail, Shield } from 'lucide-react'

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

  useEffect(() => {
    const loadMembers = async () => {
      if (!userData || !isAdmin) return

      try {
        const membersData = await getTeamMembers(userData.organizationId)

        // Load user details for each member
        const membersWithDetails = await Promise.all(
          membersData.map(async (member) => {
            const user = await getUser(member.userId)
            return {
              ...member,
              userEmail: user?.email,
              userName: user?.displayName,
            }
          })
        )

        setMembers(membersWithDetails)
      } catch (err) {
        console.error('[v0] Error loading team members:', err)
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
      // For demo: Create team member with pending status
      await addTeamMember(userData.organizationId, invitingEmail, selectedRole, selectedPermissions)

      setMembers([
        ...members,
        {
          userId: invitingEmail,
          role: selectedRole,
          permissions: selectedPermissions,
          addedAt: new Date().toISOString(),
          userEmail: invitingEmail,
        },
      ])

      setInvitingEmail('')
      setSelectedRole(UserRole.AGENT)
      setSelectedPermissions([Permission.VIEW])
    } catch (err: any) {
      setError(err.message || 'Failed to invite member')
    } finally {
      setInviting(false)
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

        {/* Invite Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>Add new team members and set their permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="email"
                  placeholder="team@example.com"
                  value={invitingEmail}
                  onChange={(e) => setInvitingEmail(e.target.value)}
                  className="bg-input border-border"
                />

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="px-3 py-2 rounded-lg bg-input border border-border text-foreground"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.AGENT}>Agent</option>
                  <option value={UserRole.VIEWER}>Viewer</option>
                </select>

                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {inviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <label className="text-sm font-medium text-foreground block mb-2">Permissions</label>
                <div className="flex flex-wrap gap-3">
                  {[Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.EXPORT].map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
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
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground capitalize">{perm}</span>
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
            <CardTitle>
              Team Members <span className="text-lg font-normal text-muted-foreground">({members.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="p-4 rounded-lg border border-border/50 flex items-center justify-between hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{member.userName || member.userEmail}</h4>
                          <p className="text-xs text-muted-foreground">
                            {member.userEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground capitalize">
                          {member.role}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-accent hover:bg-accent/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
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

        {/* Permission Guide */}
        <Card className="border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Permission Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium text-foreground">View:</span>
                <span className="text-muted-foreground ml-2">Can see leads and reports</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Edit:</span>
                <span className="text-muted-foreground ml-2">Can modify lead details and status</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Delete:</span>
                <span className="text-muted-foreground ml-2">Can delete leads permanently</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Export:</span>
                <span className="text-muted-foreground ml-2">Can download leads as Excel files</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
