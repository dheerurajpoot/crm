# LeadFlow CRM - Quick Start Guide

Get your professional CRM up and running in 5 minutes!

## Step 1: Firebase Setup (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" → Enter name "LeadFlow" → Create project
3. Once created, click "Web" icon to add web app
4. Copy the configuration (you'll need this soon)

### Enable Authentication
- Click "Authentication" in left menu
- Click "Sign-in method" tab
- Click "Email/Password" → Enable → Save

### Create Firestore Database
- Click "Firestore Database" in left menu
- Click "Create database"
- Select "Start in test mode" → Next
- Choose a region → Create

## Step 2: Configure Environment (1 minute)

1. In the project root, create `.env.local` file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and paste your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` - you'll be redirected to login!

## Step 4: First Time Setup (5 minutes)

1. Click "Sign up" on the login page
2. Fill in your details:
   - Full Name: Your Name
   - Organization Name: Your Company
   - Email: your@email.com
   - Password: Choose a strong password
3. Click "Create Account"

**You're in! 🎉**

## What You Can Do Now

### Create a Form
1. Click "Forms" in navigation
2. Click "New Form" button
3. Give it a name like "Loan Application"
4. Default fields are already there (Name, Phone, Email, City, Loan Amount)
5. Click "Create Form"

### Add a Lead
1. Click "Leads" in navigation
2. Click "New Lead" button
3. Fill in the form with test data
4. Click "Submit"

### View & Manage Leads
1. Go to "Leads" section
2. See all your leads in a table
3. Click the eye icon to see full details
4. Click the expand arrow to edit inline
5. Use filters to find specific leads

### Export Data
1. In Leads section, apply any filters you want
2. Click "Export" button
3. Excel file downloads with all filtered leads

### Invite Team Members
1. Click "Team" in navigation (Admin only)
2. Enter team member's email
3. Select their role (Admin, Manager, Agent, Viewer)
4. Check permissions they should have
5. Click "Invite"

## Default User Roles

| Role | Can View | Can Edit | Can Delete | Can Export |
|------|----------|----------|-----------|-----------|
| Admin | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ |
| Agent | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ |

## Mobile & Offline

### Use on Mobile
- Open the app on your phone
- Browser will show "Install" option
- Install as app - it works like a native app!

### Offline Support
- View leads and forms offline
- Submit new leads (queued for sync)
- Auto-syncs when back online

## Firebase Security Rules

Copy these rules to your Firestore for proper access control:

Go to Firestore → Rules tab and paste:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    match /organizations/{orgId} {
      allow read: if isOrgMember(orgId);
      allow write: if isOrgAdmin(orgId);

      match /members/{memberId} {
        allow read: if isOrgMember(orgId);
        allow write: if isOrgAdmin(orgId);
      }

      match /formTemplates/{formId} {
        allow read: if isOrgMember(orgId);
        allow write: if isOrgAdmin(orgId);
      }

      match /leads/{leadId} {
        allow read: if isOrgMember(orgId);
        allow write: if isOrgMember(orgId);
      }

      match /activities/{activityId} {
        allow read: if isOrgMember(orgId);
        allow write: if request.auth != null;
      }
    }

    function isOrgMember(orgId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    function isOrgAdmin(orgId) {
      let member = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
      return member.data.role == 'admin';
    }
  }
}
```

Click "Publish" to apply.

## Common Issues & Fixes

### "Firebase not initialized"
→ Check .env.local has all Firebase credentials

### "Can't log in"
→ Make sure Email/Password auth is enabled in Firebase

### "Leads not showing"
→ Check your user role has "View" permission

### "Export button disabled"
→ You need the "Export" permission for your role

## Next Steps

1. ✅ Explore the dashboard
2. ✅ Create multiple forms for different campaigns
3. ✅ Invite your team members
4. ✅ Set up proper security rules
5. ✅ Configure role-based permissions
6. ✅ Start collecting leads!

## Deploy to Production

Ready to go live? Deploy to Vercel:

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Select your GitHub repo
5. Add environment variables (from .env.local)
6. Click "Deploy"

Your CRM is now live! 🚀

## Tips & Tricks

💡 **Filters**: Use date range + status filters to find specific leads
💡 **Bulk Actions**: Select multiple rows to bulk update
💡 **Search**: Quick search works on names, emails, and phone numbers
💡 **Shortcuts**: Use PWA shortcuts for quick access to key features
💡 **Offline**: Forms submitted offline sync automatically when online

## Support

- 📖 See SETUP.md for detailed configuration
- 🔗 See project structure and API routes
- 🐛 Check browser console for errors
- 📝 Log activity is in lead detail modal

## What's Included

✨ Authentication & User Management
✨ Multi-organization support
✨ Role-based access control (Admin, Manager, Agent, Viewer)
✨ Form builder with custom fields
✨ Lead management & tracking
✨ Advanced filtering & search
✨ Excel export with filters
✨ Team member management
✨ Activity logging
✨ PWA with offline support
✨ Professional dark UI
✨ Mobile-responsive design
✨ Firestore real-time sync

## You're All Set! 

Your professional CRM is ready to manage leads seamlessly. Happy lead management! 🎯
