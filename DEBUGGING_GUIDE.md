# Panduan Debug: Materi Pembelajaran Tidak Muncul Semuanya

## Langkah-langkah Debug

### Langkah 1: Cek SQL Fix Sudah Dijalankan?

1. **Buka Supabase Dashboard**
2. **Pergi ke SQL Editor**
3. **Jalankan query ini:**

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'learning_contents'
ORDER BY policyname;
```

4. **Cari policy "Users can view published content"**
5. **Cek isi kolom `qual`** - harus ada `p.user_id = auth.uid()`

**Jika kolom `qual` masih berisi `e.participant_id = auth.uid()` maka SQL fix BELUM dijalankan!**

### Langkah 2: Jalankan SQL Fix

Jika sudah pasti SQL fix belum dijalankan, jalankan ini:

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

### Langkah 3: Debug Materi Pembelajaran

Jalankan script debug: `supabase/debug-learning-materials.sql`

Atau jalankan query ini satu per satu:

**Query 1: Cek berapa materi yang ada di database**
```sql
SELECT 
    COUNT(*) as total_materials,
    class_id,
    c.name as class_name
FROM learning_contents lc
LEFT JOIN classes c ON lc.class_id = c.id
WHERE lc.status = 'published'
GROUP BY class_id, c.name;
```

**Query 2: Cek enrollment user**
```sql
-- Ganti YOUR_EMAIL dengan email user yang bermasalah
SELECT 
    e.id,
    e.status,
    e.participant_id,
    p.user_id,
    p.name,
    c.id as class_id,
    c.name as class_name
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN classes c ON e.class_id = c.id
WHERE p.user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'GANTI_DENGAN_EMAIL_USER'
);
```

### Langkah 4: Cek Browser Console

1. **Buka aplikasi di browser**
2. **Login sebagai user yang bermasalah**
3. **Masuk ke halaman materi pembelajaran**
4. **Buka Developer Tools (F12 inventory**
5. **Lihat Console tab untuk error**
6. **Lihat Network tab untuk melihat query yang dikirim**

Cari error seperti:
- "permission denied"
- "RLS policy violation"
- Atau error lain

### Langkah 5: Cek Network Request

Di Network tab browser:
1. **Filter:** XHR atau Fetch
2. **Cari request ke Supabase** yang fetch learning_contents
3. **Lihat Response** - berapa banyak materi yang dikembalikan?
4. **Lihat Request** - apa query yang dikirim?

Jika response hanya mengembalikan 2 materi, berarti RLS policy masih salah.

### Langkah 6: Restart Aplikasi

Setelah menjalankan SQL fix:
1. **Stop aplikasi Next.js** (Ctrl+C)
2. **Clear cache:**
   ```bash
   npm run clean  # atau
   rm -rf .next
   ```
3. **Start ulang:**
   ```bash
   npm run dev
   ```
4. **Clear browser cache:**
   - Tekan Ctrl+Shift+Delete
   - Pilih "Cached images and files"
   - Clear

### Langkah 7: Test dengan User Lain

Coba login dengan user lain yang juga memiliki enrollment:
- Jika semua user bermasalah → Masalah di RLS policy
- Jika hanya 1 user bermasalah → Masalah di data user tersebut

## Solusi Alternatif: Nonaktifkan RLS Sementara (UNTUK TESTING SAJA!)

**⚠️ PERINGATAN: Ini hanya untuk testing di development, JANGAN gunakan di production!**

```sql
-- Nonaktifkan RLS di learning_contents sementara
ALTER TABLE learning_contents DISABLE ROW LEVEL SECURITY;

-- Test apakah semua materi sekarang muncul
-- Jika muncul, berarti masalahnya pasti di RLS policy

-- Setelah testing, aktifkan kembali
ALTER TABLE learning_contents ENABLE ROW LEVEL SECURITY;
```

## Checklist

- [ ] SQL fix sudah dijalankan di Supabase?
- [ ] Policy "Users can view published content" sudah diupdate?
- [ ] Aplikasi Next.js sudah direstart?
- [ ] Browser cache sudah dibersihkan?
- [ ] User memiliki enrollment dengan status 'approved'?
- [ ] Ada 6 materi di database dengan status 'published'?
- [ ] Class ID di enrollment sama dengan class ID di learning_contents?
- [ ] Participant record untuk user sudah ada?

Jika semua checklist sudah dicek dan masih belum muncul, kirimkan:
1. Screenshot console browser (jika ada error)
2. Hasil query debug di Supabase
3. Hasil Network request yang fetch learning_contents

