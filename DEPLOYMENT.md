
# 🚀 BLKOUT UK Comms App - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
1. A Supabase project with the schema deployed
2. Your Supabase URL and anon key
3. A GitHub account (for Vercel deployment)

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Vercel Deployment (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: BLKOUT UK Content Calendar App"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/BLKOUTUK/blkout-comms-app.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Go to [Vercel](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: dist

5. **Add Environment Variables:**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

6. **Deploy!** Vercel will automatically build and deploy your app

### Step 3: Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Alternative Deployment Options

### Netlify

1. **Push to GitHub** (same as above)
2. **Go to [Netlify](https://netlify.com)**
3. **Click "Add new site" → "Import from Git"**
4. **Select your repository**
5. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Add environment variables** in Site Settings → Environment Variables
7. **Deploy!**

### Cloudflare Pages

1. **Push to GitHub**
2. **Go to [Cloudflare Pages](https://pages.cloudflare.com)**
3. **Create a new project**
4. **Connect your GitHub repository**
5. **Configure:**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `/dist`
6. **Add environment variables**
7. **Deploy!**

### Self-Hosted (VPS/Server)

```bash
# Build the app
npm run build

# Serve with your preferred server (e.g., nginx)
# Copy dist/ contents to your web root
cp -r dist/* /var/www/html/
```

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Post-Deployment Checklist

- [ ] Test the public Discover page (`/discover`)
- [ ] Test authentication (`/login`)
- [ ] Verify admin pages require authentication
- [ ] Test content calendar functionality
- [ ] Verify agent dashboard displays correctly
- [ ] Check analytics page
- [ ] Test on mobile devices
- [ ] Verify social media embeds work (Instagram, LinkedIn)

## Supabase Configuration

### Row Level Security (RLS)

Ensure RLS is enabled on all tables. The schema includes policies for:
- Public read access to published content
- Admin/editor access to draft content
- Role-based access control

### User Roles

To set user roles in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Click on a user
3. Edit Raw User Meta Data:
   ```json
   {
     "role": "admin"
   }
   ```
4. Save

Available roles:
- `admin`: Full access
- `editor`: Content creation and management
- `content_lead`: Content creation and management
- (no role): Read-only access to published content

## Continuous Deployment

Both Vercel and Netlify support automatic deployments:
- Push to `main` branch → automatic deployment to production
- Create a pull request → automatic preview deployment

## Monitoring and Analytics

### Vercel Analytics

Enable Vercel Analytics in your project settings for:
- Real-time visitor metrics
- Page performance insights
- User engagement data

### Error Tracking

Consider integrating error tracking:
- [Sentry](https://sentry.io)
- [LogRocket](https://logrocket.com)
- [Rollbar](https://rollbar.com)

## Performance Optimization

The app is pre-optimized with:
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Optimized assets
- ✅ Gzip compression

Additional optimizations:
- Enable CDN (automatic with Vercel/Netlify)
- Configure caching headers
- Use image optimization services

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**Error: TypeScript errors**
- Run `npm run build` locally to check
- Ensure all dependencies are installed

### Authentication Issues

**Users can't log in**
- Check Supabase authentication settings
- Verify RLS policies are correctly configured
- Ensure user roles are set in metadata

### Content Not Loading

**Empty content lists**
- Check database has data
- Verify RLS policies allow access
- Check browser console for errors

### Environment Variables Not Working

Vite requires `VITE_` prefix for environment variables to be exposed to the client.

❌ Wrong: `SUPABASE_URL`
✅ Correct: `VITE_SUPABASE_URL`

## Security Notes

1. **Never commit `.env` to version control** (already in `.gitignore`)
2. **Use environment variables** for all sensitive data
3. **Keep Supabase keys secure** - never expose service role key in frontend
4. **Enable RLS** on all Supabase tables
5. **Regular security updates** - run `npm audit` regularly

## Support

For deployment issues:
- Check the [Vercel Documentation](https://vercel.com/docs)
- Check the [Supabase Documentation](https://supabase.com/docs)
- Open an issue in the GitHub repository

---

Built with ❤️ for BLKOUT UK Community
