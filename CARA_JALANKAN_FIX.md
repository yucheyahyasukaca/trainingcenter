# Cara Menjalankan Fix untuk Materi Pembelajaran

## File SQL yang Perlu Dijalankan

**File:** `supabase/fix-learning-contents-rls.sql`

Atau copy-paste SQL berikut ke Supabase SQL Editor:

```sql
-- Drop policy lama
DROP POLICY IF EXISTS "Users can view published content" ON public.learning_contents;

-- Buat policy baru yang benar
CREATE POLICY "Users can view published content"
ON public.learning_contents
FOR SELECT
TO authenticated
USING (
    status = 'published' AND (
        is_free = true
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.participants p ON e.participant_id = p.id
            JOIN public.classes c ON e.class_id = c.id
            WHERE c.id = learning_contents.class_id
            AND p.user_id = auth.uid()
            AND e.status = 'approved'
        )
    )
);
```

## Langkah-langkah

### 1. Jalankan SQL Fix
1. Buka https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste SQL di atas atau buka file `supabase/fix-learning-contents-rls.sql`
6. Klik **Run** atau tekan **Ctrl+Enter**
7. Tunggu sampai muncul pesan sukses

### 2. Restart Aplikasi
1. Stop aplikasi Next.js (jika sedang running) - tekan **Ctrl+C**
2. Clear cache:
   ```bash
   Remove-Item -Recurse -Force .next
   ```
3. Start ulang:
   ```bash
   npm run dev
   ```

### 3. Clear Browser Cache
1. Buka Developer Tools (F12)
2. Klik kanan pada tombol refresh
3. Pilih **Empty Cache and Hard Reload**
Atau:
1. Tekan **Ctrl+Shift+Delete**
2. Pilih **Cached images and files**
3. Klik **Clear data**

### 4. Test
1. Login sebagai user
2. Masuk ke halaman materi pembelajaran
3. Semua 6 materi seharusnya sudah muncul

## Jika Masih Tidak Muncul

Jalankan script debug: `supabase/debug-learning-materials.sql`

Atau cek langsung di SQL Editor:

```sql
-- Cek berapa banyak materi yang muncul untuk user yang login
SELECT COUNT(*) 
FROM learning_contents 
WHERE status = 'published';
```

Seharusnya mengembalikan 6 (atau sesuai jumlah materi yang ada).

## Catatan
- **Frontend code sudah diperbaiki** di `app/learn/[programId]/[moduleId]/page.tsx`
- **Hanya perlu menjalankan SQL fix** untuk memperbaiki RLS policy di database
- Setelah SQL fix dijalankan, studikan perlu **restart aplikasi** dan **clear cache browser**

