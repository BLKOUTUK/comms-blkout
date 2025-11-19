# Announcements System Setup Guide

## Overview

This guide walks you through setting up the announcements system for the BLKOUT UK Communications System. The announcements feature allows administrators to create and manage community announcements that appear on the Discover page.

## Architecture

### Components
- **Database**: Supabase PostgreSQL with RLS (Row Level Security)
- **Frontend**: React/TypeScript component with loading/error states
- **Service Layer**: TypeScript service for data fetching
- **Types**: Strongly typed TypeScript interfaces

### Data Flow
```
Supabase Database → Service Layer → React Component → User Interface
```

## Prerequisites

- Supabase project set up
- Supabase credentials configured in `.env` file:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Step-by-Step Setup

### Step 1: Run Database Migrations

1. **Log in to your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Navigate to the "SQL Editor" section in the left sidebar
   - Click "New query"

3. **Run the Table Creation Migration**
   - Copy the contents of `supabase/migrations/001_create_announcements_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - You should see a success message

4. **Run the Sample Data Migration**
   - Create a new query
   - Copy the contents of `supabase/migrations/002_seed_announcements.sql`
   - Paste and run it
   - This will add 7 published announcements and 1 draft for testing

### Step 2: Verify Database Setup

1. **Check the Table**
   - Go to "Table Editor" in Supabase
   - You should see the `announcements` table
   - Verify it has the correct columns

2. **Check the Data**
   - Click on the `announcements` table
   - You should see 8 rows (7 published, 1 draft)
   - Verify the data looks correct

3. **Test the Policies**
   - In SQL Editor, run:
   ```sql
   SELECT * FROM announcements WHERE status = 'published';
   ```
   - You should see 7 announcements

### Step 3: Configure Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Test the Integration

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to the Discover Page**
   - Open the app in your browser
   - Go to the Discover page
   - You should see the announcements section

3. **Verify Data Loading**
   - Announcements should load automatically
   - Check the browser console for any errors
   - If Supabase is not configured, you'll see "Demo Mode" badge and mock data

### Step 5: Admin Dashboard Setup (Future)

The admin dashboard for managing announcements will be implemented separately. For now, you can manage announcements directly through Supabase:

1. **Adding New Announcements**
   - Go to Table Editor → announcements
   - Click "Insert row"
   - Fill in the required fields:
     - `title`: Announcement title
     - `excerpt`: Short description
     - `category`: event, update, campaign, or urgent
     - `status`: published (to show) or draft (to hide)
     - `display_date`: When to show the announcement
   - Click "Save"

2. **Editing Announcements**
   - Click on any row to edit
   - Make your changes
   - Click "Save"

3. **Deleting Announcements (Soft Delete)**
   - Instead of deleting rows, set `deleted_at` to current timestamp
   - Or set `status` to 'archived'

## Database Schema Reference

### Announcements Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `title` | VARCHAR(255) | Announcement title (required) |
| `excerpt` | TEXT | Short description (required) |
| `content` | TEXT | Full content (optional) |
| `category` | VARCHAR(50) | event, update, campaign, urgent (required) |
| `link` | VARCHAR(500) | Optional external link |
| `status` | VARCHAR(20) | draft, published, archived (default: draft) |
| `author_id` | UUID | Reference to auth.users |
| `author_name` | VARCHAR(255) | Cached author name |
| `priority` | INTEGER | Higher shows first (default: 0) |
| `display_date` | TIMESTAMP | Display date (default: now) |
| `created_at` | TIMESTAMP | Auto-set on creation |
| `updated_at` | TIMESTAMP | Auto-updated on changes |
| `published_at` | TIMESTAMP | Set when first published |
| `view_count` | INTEGER | Number of views (default: 0) |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |

### Category Types

- **event**: Community events, meetings, gatherings
- **update**: General updates, feature releases, news
- **campaign**: Campaigns, initiatives, ongoing programs
- **urgent**: Urgent announcements requiring immediate attention

### Status Types

- **draft**: Not visible to public (only admins can see)
- **published**: Visible to all users
- **archived**: Hidden but preserved in database

## Frontend Components

### AnnouncementsSection Component

**Location**: `src/components/discover/AnnouncementsSection.tsx`

**Features**:
- ✅ Fetches announcements from Supabase
- ✅ Loading state with spinner
- ✅ Error state with retry functionality
- ✅ Empty state for no announcements
- ✅ Falls back to mock data if Supabase not configured
- ✅ Shows "Demo Mode" badge when using mock data
- ✅ Displays author information if available
- ✅ Color-coded category badges
- ✅ Formatted dates
- ✅ Smooth animations

### Service Layer

**Location**: `src/services/announcementsService.ts`

**Functions**:
- `fetchPublishedAnnouncements(limit)` - Get published announcements
- `fetchAnnouncementsByCategory(category, limit)` - Filter by category
- `fetchAllAnnouncements(limit)` - Get all (admin view)
- `incrementAnnouncementViews(id)` - Track view count
- `mockAnnouncements` - Fallback data

### Type Definitions

**Location**: `src/types/announcements.ts`

- `Announcement` - Display interface
- `AnnouncementDB` - Database interface
- `AnnouncementCategory` - Category type
- `AnnouncementStatus` - Status type
- `convertAnnouncementFromDB()` - Helper function

## Security (Row Level Security)

The announcements table has RLS policies configured:

1. **Public Read**: Anyone can view published announcements
2. **Authenticated Read**: Authenticated users can view all announcements
3. **Admin Write**: Only admins can create/update/delete (needs admin function)

### Setting Up Admin Access

To restrict write access to admins only, you need to:

1. **Create Admin Role or Function**
   ```sql
   -- Option 1: Using a custom function
   CREATE OR REPLACE FUNCTION is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM user_roles 
       WHERE user_id = auth.uid() 
       AND role = 'admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Update Policies**
   ```sql
   -- Update existing policies to use is_admin()
   DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
   CREATE POLICY "Admins can insert announcements"
   ON announcements FOR INSERT
   TO authenticated
   WITH CHECK (is_admin() = true);
   ```

## Troubleshooting

### Issue: No announcements showing

**Solutions**:
1. Check browser console for errors
2. Verify Supabase credentials in `.env`
3. Check that migrations were run successfully
4. Verify announcements have `status = 'published'`
5. Check that `deleted_at IS NULL`

### Issue: Permission denied errors

**Solutions**:
1. Verify RLS policies are correctly set up
2. Check that you're logged in (for admin operations)
3. Ensure your user has admin privileges

### Issue: "Demo Mode" showing when Supabase is configured

**Solutions**:
1. Verify environment variables are loaded
2. Restart the development server
3. Check for typos in `.env` file
4. Ensure values are not empty strings

### Issue: Database migration fails

**Solutions**:
1. Check for syntax errors in SQL
2. Ensure you have proper permissions in Supabase
3. Try running migrations in smaller chunks
4. Check Supabase logs for detailed error messages

## Testing

### Manual Testing Checklist

- [ ] Announcements load on Discover page
- [ ] Loading state shows briefly
- [ ] Published announcements display correctly
- [ ] Draft announcements are hidden
- [ ] Categories are color-coded correctly
- [ ] Dates format properly
- [ ] Error state shows when database is unavailable
- [ ] Retry button works
- [ ] Demo mode shows when Supabase not configured
- [ ] Author names display (when available)
- [ ] Urgent announcements have red badge

### Testing with Supabase

1. **Test Published Announcements**
   ```sql
   SELECT * FROM announcements 
   WHERE status = 'published' 
   AND deleted_at IS NULL
   ORDER BY priority DESC, display_date DESC;
   ```

2. **Test Category Filtering**
   ```sql
   SELECT * FROM announcements 
   WHERE status = 'published' 
   AND category = 'event'
   AND deleted_at IS NULL;
   ```

3. **Test View Count Increment**
   ```sql
   SELECT increment_announcement_views('announcement-id-here');
   SELECT view_count FROM announcements WHERE id = 'announcement-id-here';
   ```

## Future Enhancements

### Planned Features

1. **Admin Dashboard**
   - CRUD interface for announcements
   - Rich text editor for content
   - Image upload support
   - Scheduling future announcements
   - Analytics dashboard

2. **User Features**
   - Full announcement view modal
   - Filtering by category
   - Search functionality
   - Bookmark/save announcements
   - Email notifications for urgent announcements

3. **Advanced Features**
   - Multi-language support
   - Attachment support
   - Comments/reactions
   - Related announcements
   - Push notifications

## API Reference

### Fetch Published Announcements

```typescript
import { fetchPublishedAnnouncements } from '@/services/announcementsService';

const { data, error } = await fetchPublishedAnnouncements(10);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Announcements:', data);
}
```

### Fetch by Category

```typescript
import { fetchAnnouncementsByCategory } from '@/services/announcementsService';

const { data, error } = await fetchAnnouncementsByCategory('event', 5);
```

### Increment Views

```typescript
import { incrementAnnouncementViews } from '@/services/announcementsService';

const { error } = await incrementAnnouncementViews(announcementId);
```

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments
3. Check Supabase documentation
4. Review browser console for errors
5. Check Supabase logs in the dashboard

## Version History

- **v1.0.0** (2024-03-15)
  - Initial announcements system
  - Database schema and migrations
  - Frontend component with Supabase integration
  - Service layer and type definitions
  - Sample data and documentation

---

**Last Updated**: March 15, 2024
**Maintained By**: BLKOUT Development Team
