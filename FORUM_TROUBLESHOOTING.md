# 🔧 Forum Troubleshooting Guide

## Error: "Thread tidak ditemukan"

### Penyebab Umum

1. **Thread ID tidak valid** - URL mengandung ID yang salah
2. **Thread sudah dihapus** - Thread mungkin dihapus oleh admin/author
3. **Permission issue** - User tidak punya akses ke thread tersebut
4. **Database connection issue** - Supabase connection bermasalah

### Solusi

#### 1. Cek URL
Pastikan URL thread benar:
```
/programs/{programId}/classes/{classId}/forum/{threadId}
```

#### 2. Cek Thread di Database
```sql
-- Cek apakah thread ada
SELECT * FROM forum_threads WHERE id = 'thread-id-here';

-- Cek thread dengan category info
SELECT 
    ft.*,
    fc.name as category_name
FROM forum_threads ft
JOIN forum_categories fc ON fc.id = ft.category_id
WHERE ft.id = 'thread-id-here';
```

#### 3. Cek Permission
```sql
-- Cek apakah user punya akses ke class
SELECT 
    e.status,
    c.name as class_name
FROM enrollments e
JOIN classes c ON c.id = e.class_id
JOIN participants p ON p.id = e.participant_id
WHERE p.user_id = 'user-id-here'
AND c.id = 'class-id-here';
```

#### 4. Create Missing Functions (Jika Error RPC)

Jalankan script ini di Supabase SQL Editor:

```sql
-- Create missing RPC function
CREATE OR REPLACE FUNCTION increment_thread_view(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_threads 
  SET view_count = view_count + 1 
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Error: "RPC function not found"

### Solusi
1. Jalankan `supabase/create-forum-functions.sql`
2. Atau skip view count increment (non-critical feature)

## Error: "Categories not found"

### Penyebab
- Kelas belum memiliki kategori forum
- Auto-create trigger tidak jalan

### Solusi
```sql
-- Manual create categories untuk kelas
INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
VALUES 
    ('class-id', 'program-id', 'Perkenalan', 'Forum perkenalan', 1, true),
    ('class-id', 'program-id', 'Konsultasi & Pertanyaan', 'Forum Q&A', 2, true);
```

## Error: "Access denied"

### Penyebab
- User tidak enrolled di kelas
- Enrollment status bukan 'approved'
- RLS policy memblokir akses

### Solusi
```sql
-- Cek enrollment
SELECT * FROM enrollments 
WHERE participant_id IN (
    SELECT id FROM participants WHERE user_id = 'user-id'
)
AND class_id = 'class-id'
AND status = 'approved';
```

## Error: "Forum page blank"

### Penyebab
- JavaScript error
- Database connection issue
- Missing toast container

### Solusi
1. Check browser console untuk error
2. Pastikan toast notification system ter-install
3. Cek database connection

## Debug Steps

### 1. Check Browser Console
```javascript
// Open browser dev tools (F12)
// Check Console tab untuk error messages
```

### 2. Check Network Tab
- Lihat apakah API calls ke Supabase berhasil
- Check response status codes

### 3. Check Database
```sql
-- Test basic queries
SELECT COUNT(*) FROM forum_threads;
SELECT COUNT(*) FROM forum_categories;
SELECT COUNT(*) FROM classes;
```

### 4. Check User Session
```javascript
// In browser console
console.log('User:', await supabase.auth.getUser());
```

## Common Fixes

### Fix 1: Reset Forum Categories
```sql
-- Delete dan recreate categories
DELETE FROM forum_categories WHERE class_id = 'class-id';
INSERT INTO forum_categories (class_id, program_id, name, description, order_index, is_active)
SELECT 
    'class-id',
    program_id,
    'Perkenalan',
    'Forum perkenalan',
    1,
    true
FROM classes WHERE id = 'class-id';
```

### Fix 2: Fix Missing Functions
```sql
-- Run complete forum setup
\i supabase/create-forum-functions.sql
```

### Fix 3: Fix RLS Policies
```sql
-- Reset RLS policies
DROP POLICY IF EXISTS "Users can view categories for enrolled classes" ON forum_categories;
CREATE POLICY "Users can view categories for enrolled classes" ON forum_categories
FOR SELECT USING (true); -- Temporary open access for testing
```

## Prevention

### 1. Always Check Before Delete
```javascript
// Before deleting thread, check if it exists
const { data: thread } = await supabase
  .from('forum_threads')
  .select('id')
  .eq('id', threadId)
  .single();

if (!thread) {
  error('Thread not found', 'Thread mungkin sudah dihapus');
  return;
}
```

### 2. Graceful Error Handling
```javascript
try {
  // Forum operations
} catch (err) {
  console.error('Forum error:', err);
  error('Error', 'Terjadi kesalahan. Silakan coba lagi.');
}
```

### 3. User Feedback
```javascript
// Always provide clear feedback
if (!thread) {
  return (
    <div className="error-page">
      <h1>Thread Tidak Ditemukan</h1>
      <p>Thread yang Anda cari tidak ada atau telah dihapus.</p>
      <Link href="/forum">Kembali ke Forum</Link>
    </div>
  );
}
```

## Quick Fixes

### Fix Thread Not Found
1. **Check URL** - Pastikan thread ID benar
2. **Check Database** - Thread masih ada atau sudah dihapus
3. **Check Permission** - User punya akses ke kelas
4. **Refresh Page** - Sometimes cache issue

### Fix RPC Error
1. **Skip View Count** - Non-critical feature
2. **Create Function** - Run SQL script
3. **Use Fallback** - Manual update instead

### Fix Access Denied
1. **Check Enrollment** - User enrolled dan approved
2. **Check RLS** - Policies tidak terlalu ketat
3. **Check Role** - Admin/Manager bisa akses semua

## Support

Jika masih ada masalah:
1. **Check logs** - Browser console & database logs
2. **Test step by step** - Isolate the problem
3. **Contact support** - With specific error messages

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0
