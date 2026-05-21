# LeadFlow CRM - Architecture Overview

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore (real-time)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics
- **Export**: ExcelJS for Excel generation
- **PWA**: next-pwa + Service Workers
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication
- **Real-time**: Firestore subscriptions
- **File Storage**: Firestore + optional Cloud Storage

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database Hosting**: Google Firebase
- **CDN**: Vercel Edge Network
- **Build Tool**: Turbopack

## Project Structure

```
project/
├── app/                           # Next.js app directory
│   ├── (auth)/                   # Authentication routes (unprotected)
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   └── signup/              # Sign up page
│   │       └── page.tsx
│   ├── dashboard/               # Protected dashboard layout
│   │   ├── layout.tsx           # Dashboard layout with nav
│   │   ├── page.tsx             # Dashboard home/overview
│   │   ├── leads/
│   │   │   └── page.tsx         # Leads management
│   │   ├── forms/
│   │   │   ├── page.tsx         # Forms list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create new form
│   │   │   └── [id]/
│   │   │       └── page.tsx     # View form details
│   │   ├── team/
│   │   │   └── page.tsx         # Team management (admin)
│   │   └── settings/
│   │       └── page.tsx         # Organization settings (admin)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home/redirect page
│   └── globals.css              # Global styles & design tokens
│
├── components/
│   └── dashboard/
│       ├── dashboard-nav.tsx    # Desktop sidebar navigation
│       ├── mobile-nav.tsx       # Mobile bottom navigation
│       ├── leads-table.tsx      # Leads table with actions
│       ├── lead-filters.tsx     # Advanced lead filters
│       └── lead-detail-modal.tsx # Lead detail view & edit
│
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   ├── firestore.ts             # Firestore CRUD operations
│   ├── auth-context.tsx         # Authentication context provider
│   ├── schemas.ts               # Zod validation schemas & types
│   ├── export.ts                # Excel export utility
│   └── utils.ts                 # Utility functions
│
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── service-worker.js        # Service worker for offline
│   ├── favicon.ico
│   └── apple-touch-icon.png
│
├── next.config.mjs              # Next.js + PWA config
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment variables (git ignored)
├── QUICKSTART.md                # Quick start guide
├── SETUP.md                     # Detailed setup guide
└── ARCHITECTURE.md              # This file
```

## Data Models

### Users
```typescript
{
  uid: string,                    // Firebase UID
  email: string,
  displayName: string,
  organizationId: string,         // Link to organization
  role: 'admin' | 'manager' | 'agent' | 'viewer',
  permissions: Permission[],      // Granular permissions
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean
}
```

### Organizations
```typescript
{
  id: string,
  name: string,
  createdById: string,            // Admin user ID
  createdAt: Date,
  updatedAt: Date,
  settings: {
    defaultFormFields: string[],
    dataRetentionDays?: number
  }
}
```

### Form Templates
```typescript
{
  id: string,
  name: string,
  description?: string,
  organizationId: string,
  createdById: string,
  fields: [
    {
      id: string,
      name: string,
      label: string,
      type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'date',
      required: boolean,
      placeholder?: string,
      options?: string[],          // For select fields
      order: number
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean
}
```

### Leads
```typescript
{
  id: string,
  organizationId: string,
  formId: string,                 // Which form this came from
  formName: string,               // Cached form name
  source?: string,                // 'facebook' | 'taboola' | 'manual' | etc
  data: {
    [fieldName: string]: any      // Dynamic fields from form
  },
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
  assignedTo?: string,            // User ID
  notes?: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### Activities (Audit Log)
```typescript
{
  id: string,
  leadId: string,
  organizationId: string,
  userId: string,
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'deleted',
  changes?: {
    [fieldName: string]: {
      from: any,
      to: any
    }
  },
  createdAt: Date
}
```

## Authentication Flow

1. **Sign Up**
   - User fills signup form
   - Firebase creates user account
   - Organization created
   - User added to members
   - Redirected to dashboard

2. **Sign In**
   - Firebase authenticates user
   - User data loaded from Firestore
   - Context updated with user info
   - Dashboard accessible

3. **Protected Routes**
   - Dashboard layout checks `useAuth()`
   - If no `currentUser`, redirect to login
   - User permissions checked per action

## Permission System

### Granular Permissions
- `view` - Can see leads and data
- `edit` - Can modify lead details
- `delete` - Can permanently delete leads
- `export` - Can download Excel files

### Role-Based Defaults
- **Admin**: All permissions
- **Manager**: View, Edit, Delete, Export
- **Agent**: View, Edit
- **Viewer**: View only

## Firestore Database Structure

```
firestore/
├── users/
│   └── {uid}
│       └── User document
│
└── organizations/
    └── {orgId}/
        ├── Organization document
        ├── members/
        │   └── {userId}
        │       └── Role & permissions
        ├── formTemplates/
        │   └── {formId}
        │       └── Form template
        ├── leads/
        │   └── {leadId}
        │       └── Lead data
        └── activities/
            └── {activityId}
                └── Audit log entry
```

## Real-Time Features

### Firestore Real-Time Subscriptions
- Leads list updates when new leads added
- Activity log updates in real-time
- Team changes reflected immediately

### Offline Support
- Service Worker caches app shell
- IndexedDB stores pending submissions
- Background sync when online

## Security Architecture

### Authentication
- Firebase Auth handles password hashing
- Session managed via Firebase tokens
- Auto-logout on token expiration

### Database Security
- Firestore Security Rules enforce access
- User can only access their organization
- Role-based rule matching
- Field-level access control

### API Security
- All routes protected with auth checks
- Zod validation on all inputs
- Rate limiting (via Vercel)
- CSRF protection built-in

## Export Flow

1. User applies filters in Leads page
2. Clicks Export button
3. Client-side processing:
   - ExcelJS creates workbook
   - Headers created
   - Data rows added
   - Formatting applied
4. Browser downloads file
5. File naming: `leads-export-YYYY-MM-DD.xlsx`

## PWA Implementation

### Service Worker Features
- Cache-first for static assets
- Network-first for dynamic content
- Offline page serving
- Background sync for submissions

### Installation
- Web manifest defines app metadata
- Icons in multiple sizes
- App shortcuts for quick actions
- Splash screens for mobile

### Offline Queue
- IndexedDB stores offline submissions
- Service Worker syncs when online
- User sees success feedback
- No data loss

## Performance Optimizations

1. **Code Splitting**
   - Route-based code splitting
   - Dynamic imports where needed

2. **Data Fetching**
   - Server-side rendering where beneficial
   - Client-side caching with React
   - Firestore subscriptions for real-time

3. **UI Performance**
   - Virtualized lists for large datasets
   - Lazy loading images
   - Debounced search input

4. **Bundle Size**
   - Tree-shaking unused code
   - Dynamic imports for heavy libraries
   - Minification in production

## API Patterns

### REST Routes (Optional - for future integration)

```
POST   /api/leads                 # Create lead
GET    /api/leads                 # List leads (with filters)
GET    /api/leads/:id             # Get lead
PUT    /api/leads/:id             # Update lead
DELETE /api/leads/:id             # Delete lead

GET    /api/forms                 # List forms
POST   /api/forms                 # Create form
PUT    /api/forms/:id             # Update form

GET    /api/team                  # List team members
POST   /api/team                  # Invite member
PUT    /api/team/:id              # Update permissions
DELETE /api/team/:id              # Remove member

POST   /api/webhooks/facebook     # Facebook Ads webhook
POST   /api/webhooks/taboola      # Taboola webhook
```

### Request/Response Pattern
```typescript
// Request
{
  organizationId: string,
  data: { ... },
  filters?: { ... }
}

// Response
{
  success: boolean,
  data?: any,
  error?: string,
  meta?: {
    count: number,
    page: number
  }
}
```

## Error Handling

1. **Client-Side**
   - Try-catch in async functions
   - User-friendly error messages
   - Error boundaries for React
   - Toast notifications

2. **Server-Side**
   - Validation errors (400)
   - Authentication errors (401)
   - Permission errors (403)
   - Not found errors (404)
   - Server errors (500)

3. **Logging**
   - Console logs for debugging
   - Error boundaries log to Sentry (optional)
   - Activity audit trail in Firestore

## Scalability Considerations

### Current Setup
- Works well for up to 10,000 leads
- Suitable for teams up to 50 users
- No database optimization needed

### Future Scaling
- Add Firestore indexes for common queries
- Implement pagination for large datasets
- Archive old leads to separate collection
- Use Cloud Tasks for heavy processing

## Development Workflow

1. **Local Development**
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Code Quality**
   ```bash
   pnpm lint
   pnpm type-check
   ```

3. **Build**
   ```bash
   pnpm build
   ```

4. **Testing**
   - Write tests in `.test.ts` files
   - Run: `pnpm test`

## Deployment

### Vercel Deployment
1. Connect GitHub repo
2. Set environment variables
3. Deploy (automatic on push)

### Firebase Setup
1. Create project
2. Enable Firestore
3. Enable Auth
4. Set security rules
5. Add web app configuration

## Monitoring & Observability

### What to Monitor
- Lead submission rate
- User activity patterns
- API response times
- Error rates
- Firestore reads/writes quota

### Tools
- Firestore Dashboard for metrics
- Vercel Analytics for performance
- Error tracking (optional: Sentry)
- Custom logging

## Future Enhancements

1. **Ad Platform Integration**
   - Facebook Ads webhook
   - Taboola webhook
   - Auto-lead creation

2. **Communications**
   - SMS notifications
   - Email templates
   - WhatsApp integration

3. **Analytics**
   - Advanced reporting
   - Conversion tracking
   - Lead scoring

4. **Automation**
   - Workflow automation
   - Rule engine for lead assignment
   - Automated follow-ups

5. **Integrations**
   - Zapier support
   - REST API for partners
   - Webhook delivery

## Support & Maintenance

- Review Firestore security rules quarterly
- Update dependencies monthly
- Monitor costs on Firebase
- Backup important data
- Test disaster recovery

This architecture provides a solid foundation for a professional CRM that scales with your business!
