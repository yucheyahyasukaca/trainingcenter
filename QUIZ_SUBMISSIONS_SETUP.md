# 🔧 Setup Quiz Submissions - Panduan Lengkap

## ⚠️ Error yang Terjadi

**Error:** `relation "public.quiz_submissions" does not exist`

**Penyebab:** Tabel `quiz_submissions` belum dibuat di database Supabase Anda.

---

## 📋 Solusi: Ikuti Langkah Ini Secara Berurutan

### **STEP 1: Buka Supabase Dashboard** 

1. Go to: https://app.supabase.com
2. Login dan pilih project Anda
3. Klik **"SQL Editor"** di sidebar kiri

---

### **STEP 2: Buat Tabel quiz_submissions**

1. Klik **"New Query"** di SQL Editor
2. Copy **SELURUH** isi dari file: `supabase/create-quiz-submissions-table.sql`
3. Paste ke SQL Editor
4. Klik **"Run"** (atau tekan **Ctrl + Enter**)
5. ✅ Pastikan eksekusi berhasil tanpa error

**File yang perlu dijalankan:**
```
supabase/create-quiz-submissions-table.sql
```

**Yang akan dibuat:**
- ✅ Tabel `quiz_submissions`
- ✅ Indexes untuk performance
- ✅ Auto-grading trigger
- ✅ Permissions

---

### **STEP 3: Tambah RLS Policies**

1. Klik **"New Query"** lagi
2. Copy **SELURUH** isi dari file: `supabase/fix-quiz-submissions-rls.sql`
3. Paste ke SQL Editor
4. Klik **"Run"** (atau tekan **Ctrl + Enter**)
5. ✅ Pastikan eksekusi berhasil tanpa error

**File yang perlu dijalankan:**
```
supabase/fix-quiz-submissions-rls.sql
```

**Yang akan dibuat:**
- ✅ Policy: Users can submit quiz answers
- ✅ Policy: Users can view their own submissions
- ✅ Policy: Users can update their own submissions
- ✅ Policy: Trainers can view submissions for their classes
- ✅ Policy: Admin can manage all submissions

---

### **STEP 4: Verifikasi Table**

Jalankan query ini untuk memastikan table sudah dibuat:

```sql
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'quiz_submissions'
ORDER BY ordinal_position;
```

**Expected Output:** Anda harus melihat daftar kolom seperti:
- id
- created_at
- updated_at
- user_id
- content_id
- question_id
- selected_option_id
- answer_text
- is_correct
- points_earned
- dll

---

### **STEP 5: Verifikasi Policies**

Jalankan query ini untuk memastikan policies sudah dibuat:

```sql
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'quiz_submissions'
ORDER BY policyname;
```

**Expected Output:** Anda harus melihat 5 policies:
- Admin can manage all submissions
- Trainers can view submissions for their classes
- Users can submit quiz answers
- Users can update their own submissions
- Users can view their own submissions

---

### **STEP 6: Test Quiz Submission**

1. Buka aplikasi Anda
2. Login sebagai user
3. Akses halaman quiz
4. Jawab beberapa pertanyaan
5. Klik **"Submit Quiz"**
6. ✅ Seharusnya tidak ada error lagi!

---

## 🐛 Troubleshooting

### Masalah: "Still getting 404 error"

**Solusi:**
1. Refresh browser dengan **Ctrl + Shift + R** (hard refresh)
2. Pastikan query pertama (create table) SUDAH dijalankan
3. Cek apakah table benar-benar ada dengan query di STEP 4

### Masalah: "Permission denied"

**Solusi:**
1. Pastikan query kedua (RLS policies) SUDAH dijalankan
2. Cek policies dengan query di STEP 5
3. Pastikan user yang login adalah authenticated user

### Masalah: "Foreign key constraint violation"

**Solusi:**
1. Pastikan tables berikut sudah ada:
   - `learning_contents`
   - `quiz_questions`
   - `quiz_options`
2. Run `supabase/create-learning-content-system.sql` terlebih dahulu

---

## ✅ Checklist Setup

- [ ] Tabel `quiz_submissions` sudah dibuat
- [ ] Indexes sudah dibuat
- [ ] Auto-grading trigger sudah dibuat
- [ ] RLS policies sudah dibuat (5 policies)
- [ ] Grant permissions sudah diberikan
- [ ] Test submission berhasil
- [ ] Tidak ada error di console browser

---

## 📁 File yang Digunakan

1. `supabase/create-quiz-submissions-table.sql` - Buat table (JALANKAN PERTAMA)
2. `supabase/fix-quiz-submissions-rls.sql` - Buat RLS policies (JALANKAN KEDUA)
3. `components/learn/QuizPlayer.tsx` - Component quiz (sudah diupdate)

---

## 💡 Tips

- **Selalu jalankan SQL satu per satu**, jangan dicampur
- **Periksa output** setelah setiap eksekusi
- **Screenshot error** jika masih bermasalah untuk debugging
- **Refresh browser** setelah setup selesai

---

**Selamat! Quiz submission system seharusnya sudah bekerja dengan baik! 🎉**

