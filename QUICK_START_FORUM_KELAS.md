# 🚀 Quick Start: Forum Diskusi Kelas

## Instalasi Cepat (5 Menit)

### Step 1: Jalankan SQL Script

Di Supabase SQL Editor, jalankan:

```sql
\i supabase/auto-create-forum-categories.sql
```

Atau copy-paste isi file `supabase/auto-create-forum-categories.sql` ke SQL Editor.

### Step 2: Verifikasi

```sql
-- Cek apakah trigger sudah dibuat
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_default_forum_categories';

-- Cek kategori yang sudah dibuat untuk existing classes
SELECT 
    c.name as kelas,
    fc.name as kategori,
    fc.order_index as urutan
FROM classes c
LEFT JOIN forum_categories fc ON fc.class_id = c.id
ORDER BY c.name, fc.order_index;
```

### Step 3: Test

1. Login sebagai admin
2. Buat kelas baru
3. Akses forum kelas: `/programs/{programId}/classes/{classId}/forum`
4. Harus ada 2 kategori: "Perkenalan" dan "Konsultasi & Pertanyaan"

## ✅ Checklist

- [ ] SQL script berhasil dijalankan
- [ ] Trigger `trigger_create_default_forum_categories` ada di database
- [ ] Existing classes sudah memiliki 2 kategori forum
- [ ] UI menampilkan tombol "Forum Diskusi" di card kelas
- [ ] Peserta enrolled bisa akses forum
- [ ] Bisa create thread dan reply

## 📋 Fitur yang Tersedia

### Kategori Default (Auto-Created)

1. **Perkenalan** 
   - Untuk perkenalan diri antar peserta
   - Order: 1
   
2. **Konsultasi & Pertanyaan**
   - Untuk tanya jawab seputar materi
   - Order: 2

### UI Components

- `/programs/{id}/classes/{classId}/forum` - Daftar thread
- `/programs/{id}/classes/{classId}/forum/{threadId}` - Detail thread & replies
- Tombol "Forum Diskusi" di halaman kelas

### Permissions

- ✅ Peserta enrolled: Baca, tulis thread/reply
- ✅ Trainer: Baca, tulis, moderate
- ✅ Admin/Manager: Full access
- ❌ Non-enrolled: No access (RLS)

## 🎯 Flow Penggunaan

### Peserta

```
Login → Pilih Program → Kelas Program → Forum Diskusi → Buat/Baca Thread
```

### Trainer

```
Login → Akses Forum Kelas → Monitor & Reply Pertanyaan → Pin/Lock Thread
```

### Admin

```
Login → Akses Semua Forum → Moderate Konten → Manage Categories
```

## ⚠️ Troubleshooting Cepat

**Problem:** Kategori tidak muncul di kelas baru

**Solution:**
```sql
-- Run manual untuk kelas tertentu
DO $$
BEGIN
    PERFORM create_default_forum_categories_for_class() 
    FROM classes WHERE id = '{your_class_id}';
END $$;
```

**Problem:** User tidak bisa akses forum

**Check:**
1. User sudah enrolled? `SELECT * FROM enrollments WHERE class_id = '...'`
2. Status approved? `WHERE status = 'approved'`
3. Participant ID ada? `SELECT * FROM participants WHERE user_id = auth.uid()`

## 📚 Dokumentasi Lengkap

Lihat `FORUM_DISKUSI_KELAS_GUIDE.md` untuk:
- Penjelasan detail fitur
- Database schema
- RLS policies
- Testing scenarios
- Best practices
- Advanced troubleshooting

## 🎉 Done!

Sistem forum diskusi kelas sudah siap digunakan. Setiap kelas yang dibuat akan otomatis memiliki 2 kategori forum default.

---

**Need Help?** Check `FORUM_DISKUSI_KELAS_GUIDE.md`

