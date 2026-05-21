import { z } from 'zod'

// User roles and permissions
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

export enum Permission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  EXPORT = 'export',
}

// User schema
export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  organizationId: z.string(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(Permission)),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
})

export type User = z.infer<typeof userSchema>

// Form template schema
export const formFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'phone', 'number', 'textarea', 'select', 'date']),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  order: z.number(),
})

export type FormField = z.infer<typeof formFieldSchema>

export const formTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  organizationId: z.string(),
  createdById: z.string(),
  fields: z.array(formFieldSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
})

export type FormTemplate = z.infer<typeof formTemplateSchema>

// Lead schema
export const leadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  formId: z.string(),
  formName: z.string(),
  source: z.string().optional(),
  data: z.record(z.unknown()),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new'),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
})

export type Lead = z.infer<typeof leadSchema>

// Lead filter schema
export const leadFilterSchema = z.object({
  formId: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  searchQuery: z.string().optional(),
})

export type LeadFilter = z.infer<typeof leadFilterSchema>

// Organization schema
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  settings: z.object({
    defaultFormFields: z.array(z.string()),
    dataRetentionDays: z.number().optional(),
  }).optional(),
})

export type Organization = z.infer<typeof organizationSchema>

// Team member invitation schema
export const teamMemberInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(Permission)),
})

export type TeamMemberInvite = z.infer<typeof teamMemberInviteSchema>

// Lead activity/history schema
export const leadActivitySchema = z.object({
  id: z.string(),
  leadId: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  action: z.enum(['created', 'updated', 'status_changed', 'assigned', 'deleted']),
  changes: z.record(z.unknown()).optional(),
  createdAt: z.date(),
})

export type LeadActivity = z.infer<typeof leadActivitySchema>
