# 📚 Panduan Forum Diskusi Kelas

## Overview

Sistem Forum Diskusi Kelas telah diimplementasikan untuk memfasilitasi komunikasi dan kolaborasi antar peserta dalam setiap kelas. Setiap kelas memiliki forum diskusi dengan 2 kategori default yang dibuat secara otomatis:

1. **Perkenalan** - Forum untuk perkenalan diri antar peserta kelas
2. **Konsultasi & Pertanyaan** - Forum untuk konsultasi dan tanya jawab seputar materi kelas

## 🎯 Fitur Utama

### 1. **Auto-Create Kategori Default**
- Ketika kelas baru dibuat, sistem otomatis membuat 2 kategori forum default
- Kategori dibuat melalui database trigger
- Kategori terkait dengan `class_id` dan `program_id`

### 2. **Thread Management**
- Peserta dapat membuat thread diskusi baru
- Thread dapat di-pin oleh admin/trainer
- Thread dapat di-lock untuk mencegah reply lebih lanjut
- View count otomatis untuk setiap thread

### 3. **Reply System**
- Peserta dapat membalas thread
- Reply counter otomatis update
- Nested reply support (membalas reply)
- Mark solution untuk Q&A threads

### 4. **Access Control**
- Hanya peserta yang terdaftar (enrolled) dapat mengakses forum
- Admin dan Manager memiliki akses penuh
- Trainer dapat mengakses forum kelas yang mereka ajar

## 📁 File Structure

```
app/programs/[id]/classes/
├── [classId]/
│   └── forum/
│       ├── page.tsx                    # Halaman daftar thread
│       └── [threadId]/
│           └── page.tsx                # Halaman detail thread & replies
└── page.tsx                            # Updated dengan link ke forum

supabase/
└── auto-create-forum-categories.sql    # SQL script untuk auto-create categories
```

## 🔧 Setup & Installation

### 1. Jalankan SQL Script

Jalankan script SQL untuk mengaktifkan auto-create kategori forum:

```bash
# Di Supabase SQL Editor atau psql
\i supabase/auto-create-forum-categories.sql
```

Script ini akan:
- Membuat tabel `forum_categories` jika belum ada
- Menambah kolom `order_index` dan `is_active`
- Membuat function `create_default_forum_categories_for_class()`
- Membuat trigger untuk auto-create saat kelas baru dibuat
- Membuat kategori default untuk kelas yang sudah ada

### 2. Verifikasi Setup

Cek apakah trigger sudah aktif:

```sql
-- Cek trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_default_forum_categories';

-- Cek kategori yang sudah dibuat
SELECT 
    c.name as class_name,
    fc.name as category_name,
    fc.description
FROM classes c
JOIN forum_categories fc ON fc.class_id = c.id
ORDER BY c.name, fc.order_index;
```

## 🎨 User Interface

### Halaman Forum Kelas

**URL:** `/programs/{programId}/classes/{classId}/forum`

**Fitur:**
- Breadcrumb navigation kembali ke kelas
- Header dengan info program dan kelas
- Filter kategori (Semua, Perkenalan, Konsultasi & Pertanyaan)
- Tombol "Buat Thread Baru"
- Daftar thread dengan informasi:
  - Judul thread
  - Kategori badge
  - Author dan tanggal
  - View count & reply count
  - Pin/Lock status icons

### Form Thread Baru

**Fields:**
- Kategori (dropdown - otomatis memilih kategori pertama)
- Judul Thread (text input)
- Konten (textarea)
- Lampiran (file upload - opsional)

**Validasi:**
- Judul tidak boleh kosong
- Konten tidak boleh kosong
- User harus login

### Halaman Detail Thread

**URL:** `/programs/{programId}/classes/{classId}/forum/{threadId}`

**Fitur:**
- Thread lengkap dengan konten
- Author info dengan role badge (Trainer/Admin)
- View count dan metadata
- Daftar replies dengan author info
- Form reply baru
- Delete button untuk thread owner dan admin

## 🔐 Row Level Security (RLS) Policies

### Forum Categories

```sql
-- View: Hanya untuk peserta enrolled atau admin/trainer
"Users can view categories for enrolled classes"

-- Manage: Hanya admin/manager
"Admins can manage all categories"
```

### Forum Threads & Replies

- SELECT: Peserta enrolled, admin, trainer
- INSERT: User yang sudah login dan enrolled
- UPDATE: Author sendiri atau admin
- DELETE: Author sendiri atau admin

## 📊 Database Schema

### forum_categories

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| program_id | UUID | Reference ke programs |
| class_id | UUID | Reference ke classes |
| name | VARCHAR(255) | Nama kategori |
| description | TEXT | Deskripsi kategori |
| order_index | INTEGER | Urutan tampilan |
| is_active | BOOLEAN | Status aktif |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu update |

### forum_threads

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | Reference ke forum_categories |
| author_id | UUID | Reference ke user_profiles |
| title | VARCHAR(500) | Judul thread |
| content | TEXT | Konten thread |
| is_pinned | BOOLEAN | Status pin |
| is_locked | BOOLEAN | Status lock |
| view_count | INTEGER | Jumlah views |
| reply_count | INTEGER | Jumlah replies |
| last_reply_at | TIMESTAMPTZ | Waktu reply terakhir |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu update |

### forum_replies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| thread_id | UUID | Reference ke forum_threads |
| author_id | UUID | Reference ke user_profiles |
| content | TEXT | Konten reply |
| parent_reply_id | UUID | Reference ke forum_replies (nested) |
| is_solution | BOOLEAN | Mark sebagai solusi |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu update |

## 🧪 Testing

### Test Case 1: Auto-Create Categories

1. Login sebagai admin
2. Buat kelas baru di program
3. Verify di database:
   ```sql
   SELECT * FROM forum_categories WHERE class_id = '{new_class_id}';
   ```
4. Hasilnya harus ada 2 kategori: "Perkenalan" dan "Konsultasi & Pertanyaan"

### Test Case 2: Create Thread

1. Login sebagai peserta yang enrolled
2. Akses `/programs/{programId}/classes/{classId}/forum`
3. Klik "Buat Thread Baru"
4. Isi form dan submit
5. Thread harus muncul di list

### Test Case 3: Reply Thread

1. Klik thread untuk melihat detail
2. Scroll ke form reply
3. Tulis reply dan submit
4. Reply harus muncul di list
5. Reply count di list thread harus bertambah

### Test Case 4: Access Control

1. Login sebagai user yang tidak enrolled
2. Akses URL forum kelas
3. Harusnya tidak bisa melihat kategori/thread (RLS block)

### Test Case 5: Admin Privileges

1. Login sebagai admin
2. Buka thread orang lain
3. Delete button harus muncul
4. Bisa delete thread/reply orang lain

## 🚀 Usage Flow

### Untuk Peserta

1. **Akses Forum:**
   - Login ke sistem
   - Pilih program yang sudah di-enroll
   - Masuk ke "Kelas Program"
   - Klik tombol "Forum Diskusi" di card kelas

2. **Perkenalan:**
   - Di forum, pilih kategori "Perkenalan"
   - Klik "Buat Thread Baru"
   - Tulis perkenalan diri
   - Submit

3. **Bertanya:**
   - Pilih kategori "Konsultasi & Pertanyaan"
   - Buat thread baru dengan pertanyaan
   - Tunggu trainer/peserta lain menjawab

4. **Membalas:**
   - Klik thread yang ingin dijawab
   - Scroll ke form reply
   - Tulis jawaban
   - Submit

### Untuk Trainer

1. Akses forum kelas yang diajar
2. Monitor pertanyaan di kategori "Konsultasi & Pertanyaan"
3. Reply pertanyaan peserta
4. Pin thread penting
5. Lock thread jika diperlukan

### Untuk Admin

1. Akses semua forum kelas
2. Moderate konten (delete spam, inappropriate content)
3. Pin announcement threads
4. Lock threads yang sudah resolved
5. Manage categories jika diperlukan

## 🔍 Troubleshooting

### Categories tidak muncul untuk kelas baru

**Solusi:**
```sql
-- Manually trigger category creation
SELECT create_default_forum_categories_for_class() 
FROM classes WHERE id = '{class_id}';
```

### RLS Error saat access forum

**Check:**
1. User sudah login?
2. User enrolled di kelas?
3. Enrollment status = 'approved'?

**Debug query:**
```sql
-- Check enrollment
SELECT * FROM enrollments 
WHERE class_id = '{class_id}' 
AND participant_id IN (
  SELECT id FROM participants WHERE user_id = auth.uid()
);
```

### Thread tidak bisa dibuat

**Check:**
1. User profile ada di database?
2. Category ID valid?
3. Check browser console untuk error details

### View count tidak update

**Check:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'increment_thread_view';
```

Jika tidak ada, function mungkin perlu dibuat di script SQL.

## 📝 Best Practices

### Untuk Development

1. **Testing:** Selalu test dengan different user roles
2. **Error Handling:** Tampilkan pesan error yang jelas
3. **Loading States:** Tampilkan loading spinner saat fetch data
4. **Responsive:** Pastikan UI responsive di mobile

### Untuk Admin

1. **Monitoring:** Check forum regularly untuk spam/inappropriate content
2. **Guidelines:** Buat thread pinned dengan forum guidelines
3. **Response Time:** Reply pertanyaan peserta dalam 24 jam
4. **Archive:** Lock old threads untuk mencegah zombie threads

### Untuk Peserta

1. **Search First:** Cek apakah pertanyaan sudah dijawab di thread lain
2. **Clear Title:** Gunakan judul yang jelas dan deskriptif
3. **Formatting:** Gunakan paragraf dan formatting untuk readability
4. **Respect:** Hormati peserta dan trainer lain

## 🎉 Success Indicators

✅ Kategori forum dibuat otomatis saat kelas baru dibuat
✅ Peserta enrolled bisa akses forum kelas
✅ Thread dan reply dapat dibuat dengan lancar
✅ View count dan reply count update otomatis
✅ Admin/trainer dapat moderate konten
✅ RLS policies melindungi data dengan benar

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check dokumentasi ini
2. Check Troubleshooting section
3. Contact developer team
4. Open issue di repository

---

**Last Updated:** October 21, 2025
**Version:** 1.0.0
**Author:** Garuda Academy Development Team

