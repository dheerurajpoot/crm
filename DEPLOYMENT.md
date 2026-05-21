# LeadFlow CRM - Deployment Guide

Ready to take your CRM live? This guide covers deploying to Vercel (recommended) and other platforms.

## Pre-Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore database created in production mode
- [ ] Security rules applied to Firestore
- [ ] Firebase Authentication enabled
- [ ] `.env.local` configured locally
- [ ] App tested locally (`pnpm dev`)
- [ ] All environment variables documented
- [ ] Code committed to GitHub

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Prepare Your Code

```bash
# Ensure code is committed to GitHub
git add .
git commit -m "Ready for production"
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Sign up if you haven't already
3. Click "Create Team" if needed

### Step 3: Import Project

1. Click "Add New" → "Project"
2. Select "Import Git Repository"
3. Choose your GitHub repo (may need to authorize GitHub)
4. Select the project from the list
5. Click "Import"

### Step 4: Configure Environment Variables

1. In the import dialog, find "Environment Variables" section
2. Add each variable from your `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY = your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your_value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your_value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your_value
NEXT_PUBLIC_FIREBASE_APP_ID = your_value
```

**Important**: All variables starting with `NEXT_PUBLIC_` are safe to share (client-side only).

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 3-5 minutes)
3. You'll see a success message with your URL
4. Click the URL to see your live CRM!

### Step 6: Add Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., crm.yourcompany.com)
4. Follow DNS configuration instructions
5. Point your domain to Vercel

## Option 2: Deploy to Other Platforms

### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Push to AWS
amplify push

# Host on Amplify
amplify hosting add
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker (Self-Hosted)

1. Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

2. Build and run:

```bash
docker build -t leadflow-crm .
docker run -p 3000:3000 leadflow-crm
```

### Linux VPS (Ubuntu/Debian)

1. SSH into your server
2. Install Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Install pnpm:

```bash
npm install -g pnpm
```

4. Clone and setup:

```bash
cd /var/www
git clone your-repo.git leadflow-crm
cd leadflow-crm
pnpm install
```

5. Create `.env.local` with your variables
6. Build:

```bash
pnpm build
```

7. Start with PM2:

```bash
npm install -g pm2
pm2 start pnpm --name "leadflow" -- start
pm2 save
pm2 startup
```

8. Setup Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

9. Enable HTTPS with Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Firebase Configuration for Production

### Update Security Rules

Replace Firestore security rules with production-safe rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if isOrgMember(orgId);
      allow write: if isOrgAdmin(orgId);
      
      // Members management
      match /members/{memberId} {
        allow read: if isOrgMember(orgId);
        allow create: if isOrgAdmin(orgId);
        allow update, delete: if isOrgAdmin(orgId) || request.auth.uid == memberId;
      }
      
      // Forms
      match /formTemplates/{formId} {
        allow read: if isOrgMember(orgId);
        allow create: if isOrgMember(orgId) && request.auth != null;
        allow update: if isOrgMember(orgId) && 
                       (resource.data.createdById == request.auth.uid || isOrgAdmin(orgId));
        allow delete: if isOrgAdmin(orgId);
      }
      
      // Leads
      match /leads/{leadId} {
        allow read: if isOrgMember(orgId);
        allow create: if isOrgMember(orgId) && hasPermission('view');
        allow update: if isOrgMember(orgId) && hasPermission('edit');
        allow delete: if isOrgMember(orgId) && hasPermission('delete');
      }
      
      // Activity log
      match /activities/{activityId} {
        allow read: if isOrgMember(orgId);
        allow create: if isOrgMember(orgId);
        allow update, delete: if false;
      }
    }

    // Helpers
    function isOrgMember(orgId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    function isOrgAdmin(orgId) {
      let member = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
      return member.data.role == 'admin';
    }

    function hasPermission(permission) {
      let resource = get(/databases/$(database)/documents/organizations/$(resource.data.organizationId)/members/$(request.auth.uid));
      return resource.data.permissions.hasAny([permission]);
    }
  }
}
```

### Enable Firestore Backups

1. Go to Firestore Database
2. Click "Backups" tab
3. Click "Create Schedule"
4. Choose daily/weekly backup
5. Select retention policy

### Configure Firestore Indexes

For better performance, create indexes for:

```firestore
# Suggested Indexes
collection: organizations/{orgId}/leads
- organizationId + status + createdAt
- organizationId + formId + createdAt
- organizationId + status + assignedTo
```

## Post-Deployment Steps

### 1. Test Your Live App

- Visit your deployed URL
- Sign up with a test account
- Create a test form
- Submit a test lead
- Test all major features

### 2. Set Up Monitoring

#### Vercel Analytics
- Already included - check Performance tab
- Monitor build times and function performance

#### Firebase Monitoring
1. Go to Firebase Console
2. Check Firestore usage and quotas
3. Set up billing alerts
4. Monitor authentication metrics

#### Custom Logging (Optional)
```typescript
// Add to your app
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

### 3. Configure Backups

For Vercel:
- Automatic backups via Git
- Test deployment from backup

For Firebase:
- Enable automated backups
- Test restore process

### 4. Update Domain DNS

If using custom domain:

1. Get your provider's nameservers
2. Update DNS at your registrar
3. Wait for propagation (up to 48 hours)
4. Test with `nslookup yourdomain.com`

### 5. Enable HTTPS

- Vercel: Automatic (free Let's Encrypt)
- Others: Use Certbot or your provider's certificates

### 6. Set Up Email Notifications (Optional)

For Vercel deployment notifications:

1. Go to Project Settings → Git
2. Enable notifications for failed deployments

## Environment Variables Checklist

Before going live, ensure all these are set:

| Variable | Type | Example |
|----------|------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | `AIzaSyD...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | `my-project-123` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | `my-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | `1:1234567890:web:abcd1234` |

## Performance Optimization

### For Vercel Deployment

1. Enable Image Optimization
2. Configure ISR (Incremental Static Regeneration) if needed
3. Monitor Function execution time

### General Optimizations

```javascript
// next.config.mjs
const nextConfig = {
  // Enable SWR headers for static assets
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

## Monitoring & Maintenance

### Weekly
- Check Firebase billing
- Review error logs
- Monitor Firestore reads/writes

### Monthly
- Update dependencies: `pnpm upgrade`
- Review security updates
- Check for performance degradation

### Quarterly
- Update Node.js version
- Review Firebase rules
- Test disaster recovery

## Scaling Considerations

### When Your App Grows

1. **More Leads (>10K)**
   - Create Firestore indexes
   - Implement pagination
   - Consider Cloud Tasks for heavy operations

2. **More Users (>50)**
   - Monitor Firebase quota usage
   - Consider upgrading to Blaze plan
   - Implement rate limiting

3. **Global Users**
   - Enable CDN (Vercel Edge)
   - Use regional Firebase instances
   - Consider multi-region deployment

## Troubleshooting Deployment

### Build Fails

```bash
# Check logs
vercel logs --follow

# Clear cache
vercel env pull
rm -rf .next
pnpm install
pnpm build
```

### Environment Variables Not Working

- Verify variable names match exactly
- Check `NEXT_PUBLIC_` prefix for client vars
- Rebuild after adding variables
- Test locally first: `pnpm dev`

### Firebase Connection Issues

```bash
# Test Firebase config
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)"

# Check firestore rules
firebase rules:test --project=your-project
```

### Slow Performance

1. Check Firestore indexes
2. Monitor database queries
3. Enable Vercel analytics
4. Check function execution time
5. Review bundle size

## Rollback Plan

If something goes wrong:

### Vercel
```bash
vercel rollback
```

### Manual Rollback
```bash
# Revert to previous commit
git revert HEAD
git push
# Redeploy automatically
```

## Support

- 📖 Check Firebase documentation
- 🚀 Read Vercel deployment guide
- 📞 Contact platform support
- 💬 Check project GitHub issues

## Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Firestore security rules updated
- [ ] Firebase backups enabled
- [ ] Domain configured (if custom)
- [ ] HTTPS working
- [ ] SSL certificate valid
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Performance tested
- [ ] Error handling verified
- [ ] Email notifications working
- [ ] Backup restore tested

**Your CRM is now live and ready for users!** 🚀

For any issues, refer back to QUICKSTART.md, SETUP.md, or ARCHITECTURE.md.
