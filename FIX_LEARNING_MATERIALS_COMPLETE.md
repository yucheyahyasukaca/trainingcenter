# Fix Lengkap: Materi Pembelajaran Tidak Muncul Semuanya

## Masalah
Ketika login sebagai user, hanya 2 dari 6 materi bovenajaran yang muncul di halaman "Daftar Materi".

## Penyebab Masalah
Ada 2 masalah yang perlu diperbaiki:

### 1. RLS Policy di Database (SQL)
Policy RLS di tabel `learning_contents` salah dalam mengecek enrollment. Policy membandingkan `e.participant_id = auth.uid()`, padahal:
- `participant_id` di tabel `enrollments` merujuk ke tabel `participants` (bukan users)
- `user_id` yang sebenarnya ada di tabel `participants`
- Perlu join ke tabel `participants` untuk mencocokkan user yang sedang login

### 2. Frontend Code (JavaScript/TypeScript)
Query di halaman learn salah mengecek enrollment dengan langsung membandingkan `participant_id = profile.id`. Harus:
1. Ambil data participant dari tabel `participants` menggunakan `user_id`
2. Gunakan `participant.id` untuk mengecek enrollment

## Solusi

### Langkah 1: Jalankan SQL Fix di Supabase

Buka Supabase SQL Editor dan jalankan query berikut:

```sql
-- Drop policy lama
DROP POLICY IF EXISTS "Users can view published content" ON public.learning_contents;

-- Buat policy baru dengan join yang benar
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

File: `supabase/fix-learning-contents-rls.sql` sudah tersedia.

### Langkah 2: Code Sudah Diperbaiki

File `app/learn/[programId]/[moduleId]/page.tsx` sudah diperbaiki untuk:
1. Mengambil participant ID dari tabel `participants` terlebih dahulu
2. Menggunakan participant ID tersebut untuk mengecek enrollment
3. Menjamin user dengan enrollment yang disetujui bisa melihat semua materi

### Perubahan yang Dibuat:

**Sebelum (SALAH):**
```javascript
// Langsung membandingkan participant_id dengan profile.id
.eq('participant_id', profile?.id || '')
```

**Sesudah (BENAR):**
```javascript
// 1. Ambil participant ID dari tabel participants
const { data: participant } = await supabase
  .from('participants')
  .select('id')
  .eq('user_id', profile.id)
  .maybeSingle()

participantId = (participant as any)?.id

// 2. Gunakan participant ID untuk mengecek enrollment
if (participantId) {
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('*')
    .eq('participant_id', participantId)
    .eq('class_id', params.moduleId)
    .eq('status', 'approved')
    .maybeSingle()
}
```

## Testing

Setelah kedua langkah di atas dilakukan:

1. **Restart aplikasi Next.js** (jika sedang running)
2. **Login sebagai user** yang memiliki enrollment
3. **Masuk ke halaman materi pembelajaran**
4. **Verifikasi** bahwa semua 6 materi muncul di daftar
5. **Cek console** browser untuk memastikan tidak ada error

## File yang Dimodifikasi

### Database (SQL):
- ✅ `supabase/fix-learning-contents-rls.sql` (dibuat)
- ✅ `supabase/create-learning-content-system.sql` (diupdate)
- ✅ `supabase/step2-create-learning-contents-policies.sql` (diupdate)

### Frontend (TypeScript):
- ✅ `app/learn/[programId]/[moduleId]/page.tsx` (diupdate)

## Catatan Penting

- **Harus mengikuti kedua langkah** (SQL fix + code sudah diperbaiki)
- SQL fix harus dijalankan di Supabase untuk berlaku
- Code fix sudah tersimpan di file, tinggal restart aplikasi
- Jika masih belum muncul semua materi, cek:
  1. Apakah SQL fix sudah dijalankan di Supabase?
  2. Apakah user memiliki enrollment dengan status 'approved'?
  3. Apakah materi memiliki status 'published'?
  4. Cek console browser untuk error

## Troubleshooting

Jika setelah melakukan fix masih belum muncul semua materi:

1. **Cek di Supabase SQL Editor:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'learning_contents';
   ```
   Pastikan policy "Users can view published content" ada dan menggunakan `p.user_id = auth.uid()`

2. **Cek enrollment user:**
   ```sql
   SELECT e.*, p.user_id 
   FROM enrollments e
   JOIN participants p ON e.participant_id = p.id
   WHERE p.user_id = 'USER_ID_DISINI';
   ```
   Pastikan ada enrollment dengan status 'approved'

3. **Cek materi pembelajaran:**
   ```sql
   SELECT * FROM learning_contents 
   WHERE class_id = 'CLASS_ID_DISINI' 
   AND status = 'published';
   ```
   Pastikan ada 6 materi dengan status 'published'

