# Deployment Instructions - Enhanced Discover Page

## ✅ Implementation Complete

All code for the enhanced Discover page has been successfully created and is ready to deploy.

## 📁 Files Created

### New Components (Ready to Use)
```
src/components/discover/
├── YouTubeEmbed.tsx          ✅ YouTube channel embed
├── AnnouncementsSection.tsx  ✅ Community announcements
└── BlkoutHubWidget.tsx       ✅ BLKOUT HUB promotion
```

### Updated Files
```
src/pages/discover/DiscoverPage.tsx  ✅ Enhanced with all new sections
src/App.tsx                          ✅ Clean imports
```

## 🚀 To Deploy & Test

### 1. Start the Development Server
```bash
cd /home/ubuntu/blkout_comms_app
npm run dev
```

The server should start on `http://localhost:3000`

### 2. View the Enhanced Discover Page
Open your browser to: `http://localhost:3000/discover`

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to Vercel (Already Configured)
```bash
# The app is already connected to Vercel
# Push to GitHub to trigger automatic deployment
git add .
git commit -m "Enhanced Discover page with YouTube, Announcements, and BLKOUT HUB widget"
git push origin main
```

## 🎨 What's New on the Page

### Top Section
- **Enhanced Hero**: Bold "BLKOUT Community Platform" heading
- **Values Badges**: Creator Sovereignty, Community Power, Democratic Governance
- **Prominent BLKOUT HUB Widget**: Purple gradient card with:
  - Call-to-action buttons
  - Feature highlights
  - Links to blkouthub.com

### Middle Section (Two Columns)
- **Left**: Community Announcements with categorized cards
- **Right**: YouTube Channel Embed with subscribe button

### Bottom Section
- **Content Grid**: Existing published content (unchanged)
- **Social Media**: Instagram and LinkedIn follow cards (unchanged)

## 🔧 Troubleshooting

### If the page appears blank:
1. **Clear browser cache** and do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** for errors (F12 → Console tab)
3. **Verify Supabase connection** (app works without it, using mock data)
4. **Restart dev server**: `pkill node && npm run dev`

### If seeing TypeScript errors:
```bash
npm install
npm run dev
```

### If components don't show:
Check that all imports in `DiscoverPage.tsx` are correct:
```typescript
import { YouTubeEmbed } from '@/components/discover/YouTubeEmbed';
import { AnnouncementsSection } from '@/components/discover/AnnouncementsSection';
import { BlkoutHubWidget } from '@/components/discover/BlkoutHubWidget';
```

## 📝 Next Steps (Optional Enhancements)

### 1. Connect Live Announcements to Database
Create a Supabase table:
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('event', 'update', 'campaign', 'urgent')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Then update `AnnouncementsSection.tsx` to fetch from Supabase instead of using mock data.

### 2. Customize YouTube Channel
Update the YouTube embed URL in `YouTubeEmbed.tsx` if needed:
```typescript
// Current: https://www.youtube.com/@blkoutuk
// Change to your actual channel URL
```

### 3. Update Social Media Links
Verify all links in `DiscoverPage.tsx` point to correct accounts:
- Instagram: `@blkout_uk`
- LinkedIn: `BLKOUT UK`
- YouTube: `@blkoutuk`
- BLKOUT HUB: `blkouthub.com`

## ✨ Features Delivered

✅ Enhanced hero section matching platform brand  
✅ BLKOUT HUB promotion widget with CTA buttons  
✅ Community announcements section with categories  
✅ YouTube channel embed with subscribe link  
✅ Maintained all existing content functionality  
✅ Responsive design (mobile, tablet, desktop)  
✅ Smooth animations and transitions  
✅ Type-safe TypeScript implementation  
✅ Accessibility features  
✅ Brand-consistent colors and styling  

## 📞 Support

If you encounter any issues:
1. Check `ENHANCED_DISCOVER_PAGE.md` for technical details
2. Review component files for inline documentation
3. Verify all package dependencies are installed
4. Ensure Node.js version is compatible (v16+)

## 🎉 Success Criteria

The page should display:
1. Purple gradient hero with BLKOUT branding
2. Large BLKOUT HUB promotional card
3. Announcements on the left
4. YouTube embed on the right
5. Searchable content grid below
6. Social media follow cards at bottom

---

**Status**: ✅ Implementation Complete - Ready for Testing & Deployment
**Created**: November 19, 2024
**Framework**: React + TypeScript + Vite + Tailwind CSS
