# Announcements Quick Start Guide

## 🚀 5-Minute Setup

### 1. Run Database Migration (2 minutes)

```sql
-- In Supabase SQL Editor, run these files in order:

-- File 1: Create table
-- Copy from: supabase/migrations/001_create_announcements_table.sql
-- Paste and run in SQL Editor

-- File 2: Add sample data
-- Copy from: supabase/migrations/002_seed_announcements.sql
-- Paste and run in SQL Editor
```

### 2. Verify Setup (1 minute)

- Go to **Table Editor** in Supabase
- Look for `announcements` table
- Should see 8 announcements (7 published, 1 draft)

### 3. Test in App (2 minutes)

```bash
npm run dev
```

- Navigate to Discover page
- Announcements should load automatically
- ✅ If you see announcements → Success!
- ⚠️ If you see "Demo Mode" → Check environment variables

---

## 📝 Quick Admin Guide

### Add New Announcement (via Supabase)

1. **Table Editor** → `announcements` → **Insert row**
2. Fill required fields:
   - **title**: Your announcement title
   - **excerpt**: Short description (1-2 sentences)
   - **category**: `event`, `update`, `campaign`, or `urgent`
   - **status**: `published` (to show immediately)
   - **display_date**: Today's date or future date
3. Click **Save**

### Edit Announcement

1. **Table Editor** → `announcements`
2. Click on the row to edit
3. Make changes
4. Click **Save**

### Hide Announcement

**Option 1**: Change status to `archived`
**Option 2**: Set `deleted_at` to current timestamp

---

## 🎨 Category Guide

| Category | Use For | Badge Color |
|----------|---------|-------------|
| `event` | Meetings, gatherings, workshops | Blue (trust) |
| `update` | News, features, general updates | Purple (wisdom) |
| `campaign` | Initiatives, ongoing programs | Orange (warmth) |
| `urgent` | Time-sensitive, critical info | Red |

---

## 🔍 Quick SQL Queries

### View All Published Announcements
```sql
SELECT title, category, status, display_date 
FROM announcements 
WHERE status = 'published' 
ORDER BY priority DESC, display_date DESC;
```

### View Announcements by Category
```sql
SELECT title, excerpt, display_date 
FROM announcements 
WHERE category = 'event' 
AND status = 'published'
ORDER BY display_date DESC;
```

### Update Announcement Status
```sql
UPDATE announcements 
SET status = 'published' 
WHERE id = 'your-announcement-id';
```

### Set Priority (higher shows first)
```sql
UPDATE announcements 
SET priority = 100 
WHERE id = 'your-announcement-id';
```

---

## ⚠️ Troubleshooting

### No announcements showing?

1. **Check status**: Must be `published`
2. **Check deleted_at**: Must be `NULL`
3. **Check console**: Look for error messages
4. **Check .env**: Verify Supabase credentials

### Seeing "Demo Mode"?

- Supabase credentials not configured
- Check `.env` file has:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-key
  ```
- Restart dev server after updating `.env`

---

## 📚 More Information

See `ANNOUNCEMENTS_SETUP.md` for:
- Complete database schema
- Security configuration
- Advanced features
- API reference
- Testing guide

---

**Need Help?** Check browser console and Supabase logs for detailed error messages.
