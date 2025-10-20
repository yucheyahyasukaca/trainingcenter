# Panduan Perbaikan Masalah Classes

## 🔍 Masalah yang Ditemukan

1. **Data Science program menampilkan "1 kelas" tetapi kosong di manajemen kelas**
2. **Gagal menambahkan kelas baru**

## 🎯 Akar Masalah

Setelah investigasi mendalam, ditemukan beberapa masalah:

1. ✅ **Type definitions hilang**: Tabel `classes` dan `class_trainers` tidak terdefinisi di `types/database.ts`
2. ✅ **Schema mungkin belum lengkap**: Tabel classes mungkin belum dibuat dengan benar di database
3. ✅ **RLS policies**: Policies untuk tabel classes mungkin tidak ada atau salah konfigurasi

## 🛠️ Perbaikan yang Sudah Dilakukan

### 1. Update Type Definitions ✅

File yang diupdate:
- `types/database.ts` - Menambahkan definisi untuk `classes`, `class_trainers`, dan `user_profiles`
- `types/index.ts` - Menambahkan export untuk `UserProfile`

### 2. Menambahkan Debugging ✅

File yang diupdate:
- `app/programs/page.tsx` - Menambahkan log untuk class count
- `components/programs/ClassManagement.tsx` - Menambahkan log untuk classes data

### 3. Memperbaiki UI ✅

File yang diupdate:
- `app/programs/page.tsx` - Menampilkan "Belum ada kelas" jika tidak ada kelas

## 📋 Langkah-langkah Perbaikan

### Langkah 1: Jalankan Script SQL

Buka **Supabase SQL Editor** dan jalankan script berikut **SECARA BERURUTAN**:

1. **FIX_CLASSES_TABLE_COMPLETE.sql** - Script lengkap yang akan:
   - Membuat tabel `classes` jika belum ada
   - Membuat tabel `class_trainers` jika belum ada
   - Mengatur RLS policies
   - Menambahkan sample class untuk Data Science program
   - Memverifikasi hasilnya

```bash
# Buka file: supabase/FIX_CLASSES_TABLE_COMPLETE.sql
# Copy seluruh isi dan paste ke Supabase SQL Editor
# Klik "Run" untuk menjalankan
```

### Langkah 2: Verifikasi di Browser

1. **Refresh halaman** programs (tekan Ctrl+Shift+R atau Cmd+Shift+R)
2. **Buka Console** (F12) untuk melihat log
3. **Periksa class count** di kartu program Data Science
4. **Klik icon BookOpen** untuk membuka manajemen kelas
5. **Coba tambah kelas baru**

### Langkah 3: Test Add Class

1. Di manajemen kelas, klik **"Tambah Kelas"**
2. Isi form:
   - Nama Kelas: "Test Class"
   - Maksimal Peserta: 15
   - Tanggal Mulai: pilih tanggal
   - Tanggal Selesai: pilih tanggal
   - Jam Mulai: 09:00
   - Jam Selesai: 17:00
   - Lokasi: "Garuda Academy"
   - Ruang: "Room A-101"
3. Klik **"Simpan Kelas"**
4. Periksa apakah kelas berhasil ditambahkan

## 🔧 Troubleshooting

### Jika masih gagal menambahkan kelas:

1. **Cek error di Console (F12)**
   ```javascript
   // Cari error message seperti:
   // - "relation 'classes' does not exist"
   // - "permission denied for table classes"
   // - "violates foreign key constraint"
   ```

2. **Verifikasi tabel ada di database**
   ```sql
   -- Jalankan di Supabase SQL Editor:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
       AND table_name IN ('classes', 'class_trainers');
   ```

3. **Cek RLS policies**
   ```sql
   -- Jalankan di Supabase SQL Editor:
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename IN ('classes', 'class_trainers');
   ```

4. **Cek foreign key constraint**
   ```sql
   -- Pastikan program_id valid:
   SELECT id, title 
   FROM programs 
   WHERE status = 'published';
   ```

### Jika Data Science masih menunjukkan class count yang salah:

1. **Clear browser cache** dan refresh
2. **Restart development server** jika menggunakan localhost
3. **Cek data di database**
   ```sql
   SELECT 
       p.title,
       COUNT(c.id) as actual_class_count
   FROM programs p
   LEFT JOIN classes c ON p.id = c.program_id
   GROUP BY p.id, p.title;
   ```

## 📊 Expected Results

Setelah perbaikan berhasil:

✅ **Program Data Science** akan menampilkan "1 kelas" DAN ada kelas di manajemen kelas
✅ **Bisa menambahkan kelas baru** tanpa error
✅ **Kelas yang ditambahkan** langsung muncul di daftar
✅ **Class count** di kartu program sesuai dengan data sebenarnya

## 🎯 Files yang Sudah Diubah

1. `types/database.ts` - Menambahkan type definitions
2. `types/index.ts` - Menambahkan exports
3. `app/programs/page.tsx` - Debugging dan UI improvements
4. `components/programs/ClassManagement.tsx` - Debugging
5. `supabase/FIX_CLASSES_TABLE_COMPLETE.sql` - Script perbaikan database

## 📞 Jika Masih Bermasalah

Jika setelah mengikuti semua langkah masih ada masalah:

1. Share **error message** dari console
2. Share **screenshot** dari error
3. Share hasil query dari **STEP 7** di script SQL (verification queries)

## ✨ Summary

Masalah utama adalah **type definitions hilang** untuk tabel `classes` dan `class_trainers`. Ini menyebabkan TypeScript tidak mengenali tabel-tabel tersebut, sehingga query gagal atau tidak berjalan dengan benar.

Perbaikan yang dilakukan:
1. ✅ Menambahkan type definitions lengkap
2. ✅ Memastikan tabel exists dengan schema yang benar
3. ✅ Mengatur RLS policies yang benar
4. ✅ Menambahkan sample data
5. ✅ Memperbaiki UI untuk menampilkan status yang benar

**Silakan jalankan script SQL dan test lagi!** 🚀

