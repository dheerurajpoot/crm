# LeadFlow CRM - Setup Guide

LeadFlow CRM is a professional lead management system with PWA support, team collaboration, and advanced filtering capabilities.

## Features

✨ **Core Features**
- Multi-user authentication with role-based access control
- Firestore database integration for real-time lead management
- Multiple form templates with customizable fields
- Lead filtering by form, status, date, and search
- Excel export functionality with applied filters
- Team member management with granular permissions
- Activity/audit logging for all operations
- Professional dark-themed UI
- Mobile-first responsive design
- PWA support for offline functionality

🔐 **Security**
- Firebase Authentication with email/password
- Firestore security rules for role-based access
- Granular permission system (View, Edit, Delete, Export)
- Audit trail for all data changes
- Protected API routes with authentication checks

📱 **Mobile & PWA**
- Responsive design that works on all devices
- Bottom navigation on mobile, sidebar on desktop
- Installable as a native app on iOS and Android
- Offline support with service worker
- Offline lead submission queue with auto-sync

## Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase project (free tier works)
- Modern web browser with PWA support

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Create Firestore Database:
   - Go to Firestore Database
   - Start in test mode (configure security rules later)
   - Choose a region close to you
5. Get your configuration:
   - Go to Project Settings > General
   - Copy the Web SDK configuration values

## Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your Firebase credentials to `.env.local`**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - You'll be redirected to login page
   - Click "Sign up" to create your first account

## Firestore Security Rules

Replace the default Firestore security rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      allow read: if request.auth != null && (
        request.auth.uid == uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == resource.data.organizationId)
      );
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if isOrgMember(orgId);
      allow create: if request.auth != null;
      allow update, delete: if isOrgAdmin(orgId);

      // Organization sub-collections
      match /members/{memberId} {
        allow read: if isOrgMember(orgId);
        allow create: if request.auth != null && (
          isOrgAdmin(orgId) || 
          (memberId == request.auth.uid && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId)
        );
        allow update: if isOrgAdmin(orgId);
        allow delete: if request.auth != null && (
          isOrgAdmin(orgId) || 
          memberId == request.auth.token.email
        );
      }

      match /formTemplates/{formId} {
        allow read: if isOrgMember(orgId) || (resource != null && resource.data.isActive == true);
        allow write: if isOrgAdmin(orgId) || isFormCreator(orgId, formId);
      }

      match /leads/{leadId} {
        allow read: if isOrgMember(orgId) && hasPermission(orgId, 'view');
        allow create: if true; // allow public leads creation from embedded landing page forms
        allow update: if isOrgMember(orgId) && hasPermission(orgId, 'edit');
        allow delete: if isOrgMember(orgId) && hasPermission(orgId, 'delete');
      }

      match /activities/{activityId} {
        allow read: if isOrgMember(orgId);
        allow write: if request.auth != null || request.resource.data.userId == 'public_form';
      }
    }

    // Helper functions
    function isOrgMember(orgId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
    }

    function isOrgAdmin(orgId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function hasPermission(orgId, permission) {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userData.organizationId == orgId && userData.permissions.hasAny([permission]);
    }

    function isFormCreator(orgId, formId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/organizations/$(orgId)/formTemplates/$(formId)).data.createdById == request.auth.uid;
    }
  }
}
```

## User Roles & Permissions

### Admin
- Full access to all features
- Can manage team members
- Can modify forms and leads
- Can export data
- Can access settings

### Manager
- Can view and manage leads
- Can modify team member permissions
- Can export data
- Limited form management

### Agent
- Can view and manage assigned leads
- Can contact and update lead status
- Limited to their assigned leads

### Viewer
- Read-only access
- Can view leads and reports
- Cannot modify any data

## Default Form Fields

The default form comes with these fields:
- Name (Text, Required)
- Phone (Phone, Required)
- Email (Email, Required)
- City (Text, Required)
- Loan Amount (Number, Required)

You can customize these in the form builder.

## Using the CRM

### Creating Leads
1. Go to **Leads** section
2. Click **New Lead**
3. Fill in the form and submit
4. Lead appears in the leads list

### Managing Forms
1. Go to **Forms** section
2. Click **New Form** to create custom form
3. Add fields with custom labels and types
4. Use form templates for quick setup

### Exporting Data
1. Go to **Leads** section
2. Apply any filters you want
3. Click **Export** button
4. Download Excel file with filtered leads

### Team Management
1. Go to **Team** section (Admin only)
2. Enter team member email and select role
3. Choose specific permissions
4. Click Invite

## Offline Support

The app works offline with the following features:
- View previously loaded leads
- See forms and templates
- Queue lead submissions when offline
- Auto-sync when back online

## Troubleshooting

**Firebase not loading?**
- Check your `.env.local` has all Firebase credentials
- Verify Firebase project exists and is active
- Check browser console for specific errors

**Can't sign up?**
- Ensure Email/Password authentication is enabled in Firebase
- Check that Firestore database is in test mode or has proper rules

**Leads not appearing?**
- Verify you're in the correct organization
- Check your user role has view permission
- Check browser network tab for API errors

**Export not working?**
- Ensure you have export permission
- Check that you have at least one lead
- Try reducing the number of filtered leads

## Project Structure

```
app/
├── (auth)/              # Authentication routes
│   ├── login/
│   └── signup/
├── dashboard/           # Protected dashboard routes
│   ├── leads/
│   ├── forms/
│   ├── team/
│   └── settings/
├── layout.tsx
└── page.tsx

lib/
├── firebase.ts          # Firebase initialization
├── firestore.ts         # Firestore operations
├── auth-context.tsx     # Authentication context
├── schemas.ts           # Zod validation schemas
└── export.ts            # Excel export utility

components/
└── dashboard/           # Dashboard components
    ├── dashboard-nav.tsx
    ├── mobile-nav.tsx
    ├── leads-table.tsx
    ├── lead-filters.tsx
    └── lead-detail-modal.tsx

public/
├── manifest.json        # PWA manifest
└── service-worker.js    # Service worker for offline support
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables in Vercel settings
4. Deploy!

The app will be available at `https://your-domain.vercel.app`

## API Routes

The app uses Firestore directly. Add API routes as needed in `app/api/`

Example structure for future integrations:
```
app/api/
├── leads/
│   ├── route.ts         # GET/POST leads
│   └── [id]/route.ts    # GET/PUT/DELETE specific lead
├── forms/
│   └── route.ts
└── webhooks/
    └── facebook.ts      # Webhook handlers for ad platforms
```

## Support & Documentation

- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [PWA Guide](https://web.dev/progressive-web-apps/)

## License

This project is available for personal and commercial use.

## Future Enhancements

- [ ] Webhook integration for Facebook Ads
- [ ] Taboola ads integration
- [ ] SMS notifications
- [ ] Email templates
- [ ] Lead scoring
- [ ] Advanced analytics dashboard
- [ ] Custom report builder
- [ ] API for third-party integrations
- [ ] Dark/Light mode toggle
- [ ] Multi-language support
