# BLKOUT UK Communications System - Vercel Deployment Guide

## 📋 Prerequisites

- GitHub account with access to BLKOUTUK organization
- Vercel account (sign up at https://vercel.com if you don't have one)
- Repository pushed to GitHub: `BLKOUTUK/comms-blkout`

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

First, ensure your code is pushed to the GitHub repository:

```bash
cd /home/ubuntu/blkout_comms_app

# Add remote if not already added
git remote add origin https://github.com/BLKOUTUK/comms-blkout.git

# Push to main branch
git push -u origin main
```

### Step 2: Connect to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Sign in with your GitHub account (recommended for seamless integration)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Authorize Vercel to access your GitHub account if prompted
   - Select the BLKOUTUK organization
   - Find and select the `comms-blkout` repository

3. **Configure Project**
   - **Project Name**: `blkout-comms` (or your preferred name)
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected from vercel.json)
   - **Output Directory**: `dist` (auto-detected from vercel.json)
   - **Install Command**: `npm install` (auto-detected)

### Step 3: Configure Environment Variables

Add the following environment variables in Vercel:

1. Click on "Environment Variables" section during setup
2. Add each variable:

#### Required Variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Found in Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Found in Supabase Dashboard → Settings → API |
| `VITE_AUTH_DISABLED` | `true` or `false` | Set to `true` for development, `false` for production with auth |
| `VITE_MOCK_USER_EMAIL` | `admin@blkout.dev` | Only used when AUTH_DISABLED=true |
| `VITE_MOCK_USER_NAME` | `BLKOUT Admin` | Only used when AUTH_DISABLED=true |

> **Important**: Make sure to select "Production", "Preview", and "Development" for each variable unless you want different values per environment.

### Step 4: Deploy

1. Click "Deploy" button
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to their global CDN
3. Wait for deployment to complete (usually 1-3 minutes)

### Step 5: Access Your Application

Once deployed, you'll receive:
- **Production URL**: `https://blkout-comms.vercel.app` (or similar)
- **Preview URLs**: Generated for each PR and commit

---

## 🔧 Post-Deployment Configuration

### Automatic Deployments

Vercel automatically deploys:
- ✅ **Production**: Every push to `main` branch
- ✅ **Preview**: Every push to other branches or pull requests

### Custom Domain Setup (discover.blkoutuk.com)

Once you're ready to use a custom domain:

1. **In Vercel Dashboard**:
   - Go to your project
   - Navigate to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter: `discover.blkoutuk.com`

2. **In Your DNS Provider** (e.g., Cloudflare, GoDaddy):
   - Add a CNAME record:
     - **Type**: CNAME
     - **Name**: `discover`
     - **Value**: `cname.vercel-dns.com`
     - **TTL**: Auto or 3600
   
   OR use A records if preferred:
   - Vercel will provide specific A record values after you add the domain

3. **Verify Domain**:
   - Back in Vercel, click "Verify" once DNS is configured
   - It may take a few minutes to propagate
   - SSL certificate will be automatically provisioned

---

## 🔒 Security Considerations

### Environment Variables
- ✅ `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe to expose (they're public keys)
- ⚠️ Never commit `.env` file to Git
- ⚠️ Never use your Supabase service_role key in frontend code

### Authentication
For production deployment:
- Set `VITE_AUTH_DISABLED=false`
- Ensure Supabase Row Level Security (RLS) is configured
- Test authentication flow before going live

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors: `npm run build` locally

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_`
- Variables must be set before build (not at runtime)
- Redeploy after adding/changing variables

### Routing Issues (404 on refresh)
- The `vercel.json` file handles SPA routing
- Ensure it's committed to the repository
- All routes should redirect to `index.html`

### Supabase Connection Issues
- Verify URL and key are correct
- Check Supabase project is active
- Review browser console for specific errors

---

## 📊 Monitoring & Analytics

Vercel provides built-in analytics:
- Visit your project dashboard
- Click "Analytics" tab
- View page views, performance metrics, and errors

---

## 🔄 Updating Your Deployment

To update the live application:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically detect the push and redeploy.

---

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vite Documentation**: https://vitejs.dev/
- **Supabase Documentation**: https://supabase.com/docs

---

## ✅ Quick Checklist

Before deploying, ensure:
- [ ] Code is pushed to GitHub (`BLKOUTUK/comms-blkout`)
- [ ] `vercel.json` is committed
- [ ] You have Supabase credentials ready
- [ ] Vercel account is set up
- [ ] GitHub organization access is configured

After deployment:
- [ ] Test all pages (Discover, Admin Dashboard)
- [ ] Verify environment variables are working
- [ ] Test responsive design on mobile
- [ ] Configure custom domain (when ready)
- [ ] Set up production environment variables
- [ ] Enable authentication (set `VITE_AUTH_DISABLED=false`)

---

## 🎉 Success!

Your BLKOUT UK Communications System should now be live on Vercel!

**Next Steps:**
1. Share the Vercel URL with your team for testing
2. Configure custom domain when ready
3. Enable Supabase authentication for production
4. Set up monitoring and alerts

**Need Help?**
- Check Vercel deployment logs
- Review browser console for frontend errors
- Verify Supabase configuration in dashboard
