# 📝 Cara Membuat Soal Quiz

## 📌 Opsi 1: Menggunakan Interface Admin/Unit Manajemen (Paling Mudah)

Sistem ini telah dilengkapi dengan **UI Quiz Management** yang user-friendly untuk membuat dan mengelola soal quiz!

### Langkah-langkah:

#### 1️⃣ **Buat Learning Content dengan Tipe Quiz** dulu

Sebelum membuat soal quiz, Anda perlu membuat learning content dengan tipe quiz:

**Via Supabase SQL Editor:**

```sql
-- Masukkan ke dalam learning_contents dengan content_type = 'quiz'
INSERT INTO learning_contents (
    class_id,
    title,
    description,
    content_type,
    content_data,
    order_index,
    status,
    is_required
) VALUES (
    'YOUR_CLASS_ID',  -- Ganti dengan ID kelas Anda
    'Quiz Pemahaman Materi',
    'Uji pemahaman Anda tentang materi yang telah dipelajari',
    'quiz',
    '{"passing_score": 75}'::jsonb,
    1,
    'published',
    true
) RETURNING id;
```

#### 2️⃣ **Akses Halaman Quiz Management**

Setelah learning content quiz dibuat, akses halaman management di:

```
/programs/[programId]/classes/[classId]/content/[contentId]/quiz
```

**Contoh URL:**
```
http://localhost:3000/programs/550e8400-e29b-41d4-a716-446655440001/classes/650e8400-e29b-41d4-a716-446655440001/content/quiz-content-001/quiz
```

#### 3️⃣ **Tambah Pertanyaan Baru**

Di halaman Quiz Management, klik tombol **"Tambah Pertanyaan"** untuk membuka form:

**Form yang tersedia:**
- ✅ **Pertanyaan Text**: Masukkan soal
- ✅ **Tipe Pertanyaan**: 
  - Pilihan Ganda (Multiple Choice)
  - Benar/Salah (True/False)
  - Essay
  - Jawaban Singkat
- ✅ **Poin**: Jumlah poin untuk jawaban benar
- ✅ **Opsi Jawaban** (untuk Multiple Choice):
  - 💡 **Quick Paste Feature** (BARU!): Paste semua opsi sekaligus!
    - Salin text dengan format satu opsi per baris:
      ```
      Pilihan A
      Pilihan B
      Pilihan C
      Pilihan D
      ```
    - Paste di box **"Quick Paste"** di atas → Opsi otomatis dibuat!
    - Atau paste langsung di input field manapun → Opsi otomatis bertambah!
  - Tambah opsi secara manual
  - Centang opsi yang benar
  - Label otomatis A, B, C, D, dst.
- ✅ **Jawaban Benar** (untuk True/False): Pilih Benar atau Salah
- ✅ **Penjelasan**: (Opsional) Penjelasan yang akan ditampilkan setelah quiz selesai

#### 4️⃣ **Kelola Pertanyaan**

- ✅ **Edit**: Klik icon edit untuk mengubah pertanyaan
- ✅ **Delete**: Klik icon trash untuk menghapus
- ✅ **Reorder**: Gunakan arrow up/down untuk mengubah urutan
- ✅ **Preview**: Lihat pertanyaan dengan format final

---

## 📌 Opsi 2: Menggunakan SQL (Manual)

Jika Anda lebih nyaman menggunakan SQL langsung atau ingin membuat banyak soal sekaligus:

### Langkah-langkah:

#### 1️⃣ **Buat Learning Content Quiz** (jika belum ada)

```sql
-- Dapatkan class_id terlebih dahulu
SELECT id, name FROM classes LIMIT 5;

-- Insert learning content quiz
INSERT INTO learning_contents (
    id,  -- Buat UUID
    class_id,  -- Ganti dengan class_id dari query di atas
    title,
    description,
    content_type,
    content_data,
    order_index,
    status,
    is_required,
    estimated_duration,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_CLASS_ID_HERE',  -- Ganti ini!
    'Quiz: Pemahaman Konsep Dasar',
    'Quiz untuk menguji pemahaman konsep dasar',
    'quiz',
    '{"passing_score": 75}'::jsonb,
    1,
    'published',
    true,
    30,  -- 30 menit
    NOW(),
    NOW()
) RETURNING id;
```

**Simpan `id` yang dikembalikan!** (ini adalah `content_id`)

#### 2️⃣ **Buat Pertanyaan Multiple Choice**

```sql
-- Insert pertanyaan
INSERT INTO quiz_questions (
    id,
    content_id,  -- Gunakan ID dari langkah sebelumnya
    question_text,
    question_type,
    order_index,
    points,
    explanation,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_CONTENT_ID_HERE',  -- Ganti dengan content_id
    'Apa yang dimaksud dengan pembelajaran adaptif?',
    'multiple_choice',
    1,
    10,
    'Pembelajaran adaptif adalah metode pembelajaran yang menyesuaikan konten dan penilaian dengan kebutuhan setiap peserta.',
    NOW(),
    NOW()
) RETURNING id;

-- Insert opsi jawaban (gunakan ID dari pertanyaan di atas)
INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    ('QUESTION_ID_1', 'Pembelajaran yang sama untuk semua peserta', false, 0),
    ('QUESTION_ID_1', 'Pembelajaran yang menyesuaikan dengan kebutuhan peserta', true, 1),
    ('QUESTION_ID_1', 'Pembelajaran tanpa instruktur', false, 2),
    ('QUESTION_ID_1', 'Pembelajaran hanya dengan buku', false, 3);
```

#### 3️⃣ **Buat Pertanyaan True/False**

```sql
INSERT INTO quiz_questions (
    id,
    content_id,
    question_text,
    question_type,
    order_index,
    points,
    explanation,
    correct_answer,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_CONTENT_ID_HERE',
    'Setiap peserta memiliki gaya belajar yang sama.',
    'true_false',
    2,
    5,
    'Setiap peserta memiliki gaya belajar yang berbeda, sehingga instruktur perlu menggunakan variasi metode pembelajaran.',
    'Salah',  -- Jawaban benar
    NOW(),
    NOW()
);
```

#### 4️⃣ **Buat Pertanyaan Essay**

```sql
INSERT INTO quiz_questions (
    id,
    content_id,
    question_text,
    question_type,
    order_index,
    points,
    explanation,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_CONTENT_ID_HERE',
    'Jelaskan bagaimana Anda mengimplementasikan prinsip pembelajaran adaptif dalam kelas Anda.',
    'essay',
    3,
    20,
    'Jawaban essay akan dinilai manual oleh instruktur.',
    NOW(),
    NOW()
);
```

---

## 🎨 Tipe-Tipe Quiz yang Didukung

| Tipe | Deskripsi | Auto-Grading | Penggunaan |
|------|-----------|--------------|------------|
| **Multiple Choice** | Pilihan ganda dengan beberapa opsi | ✅ Ya | Cocok untuk tes objektif |
| **True/False** | Pertanyaan benar/salah | ✅ Ya | Cocok untuk quick check |
| **Short Answer** | Jawaban singkat | ❌ Manual | Cocok untuk jawaban singkat |
| **Essay** | Jawaban panjang | ❌ Manual | Cocok untuk penilaian mendalam |

---

## 📊 Struktur Data Quiz

### Tabel `quiz_questions`
- `id`: UUID pertanyaan
- `content_id`: FK ke `learning_contents`
- `question_text`: Teks pertanyaan
- `question_type`: Tipe pertanyaan (multiple_choice, true_false, essay, short_answer)
- `order_index`: Urutan tampil
- `points`: Jumlah poin
- `explanation`: Penjelasan (opsional)
- `correct_answer`: Jawaban benar (untuk true/false)

### Tabel `quiz_options` (untuk Multiple Choice)
- `id`: UUID opsi
- `question_id`: FK ke `quiz_questions`
- `option_text`: Teks opsi (A, B, C, D...)
- `is_correct`: Boolean (true jika jawaban benar)
- `order_index`: Urutan tampil

---

## ✨ Fitur Quiz yang Tersedia

- ✅ **Progressive Navigation**: Navigator untuk melompat antar soal
- ✅ **Auto-grading**: Untuk Multiple Choice & True/False
- ✅ **Manual Grading**: Untuk Essay & Short Answer
- ✅ **Instant Feedback**: Penjelasan ditampilkan setelah submit
- ✅ **Scoring**: Skor otomatis dihitung
- ✅ **Passing Score**: Minimal 75% untuk lulus
- ✅ **Retry**: Peserta bisa mengulang quiz
- ✅ **Progress Tracking**: Progress tersimpan di `learning_progress`

---

## 🎯 Tips Membuat Quiz yang Baik

### ✅ Best Practices:

1. **Variasikan Tipe Soal**
   - Gunakan campuran multiple choice, true/false, dan essay
   - Jangan hanya mengandalkan satu jenis

2. **Soal Jelas dan Spesifik**
   - Hindari pertanyaan ambigu
   - Gunakan bahasa yang mudah dipahami

3. **Berikan Penjelasan**
   - Tambahkan penjelasan di setiap soal
   - Ini membantu peserta belajar dari kesalahan

4. **Distribusi Poin**
   - Essay: 15-25 poin
   - Multiple Choice: 5-10 poin
   - True/False: 2-5 poin

5. **Jumlah Soal Optimal**
   - 5-10 soal untuk quiz pendek
   - 10-20 soal untuk assessment lengkap

---

## 🔗 File-file Terkait

- **Quiz Management UI**: `components/programs/QuizManagement.tsx`
- **Quiz Player**: `components/learn/QuizPlayer.tsx`
- **Learning Page**: `app/learn/[programId]/[moduleId]/page.tsx`
- **Database Schema**: `supabase/create-learning-content-system.sql`

---

## 📞 Butuh Bantuan?

Jika Anda mengalami kesulitan:
1. Pastikan `learning_contents` dengan `content_type='quiz'` sudah dibuat
2. Pastikan Anda login sebagai admin atau trainer yang ditugaskan ke kelas tersebut
3. Akses halaman quiz management melalui URL yang benar
4. Pastikan database tables (`quiz_questions`, `quiz_options`) sudah ada

---

**Selamat membuat quiz! 🎉**

