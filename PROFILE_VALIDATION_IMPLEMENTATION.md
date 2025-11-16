# Implementasi Validasi Profil untuk Pendaftaran Program

## Ringkasan

Fitur ini memastikan bahwa peserta yang ingin mendaftar program harus melengkapi data profil mereka terlebih dahulu. Jika profil belum lengkap, sistem akan menampilkan notifikasi toast dan mengarahkan user ke halaman edit profil.

## Perubahan yang Dilakukan

### 1. **File yang Diupdate**

#### a. `app/programs/[id]/enroll/page.tsx`
- Menambahkan validasi profil di fungsi `fetchProgram()`
- Memeriksa kelengkapan data dari tabel `user_profiles` dan `participants`
- Menampilkan toast notification jika profil belum lengkap
- Redirect ke `/profile/edit` dengan parameter `return` untuk kembali setelah lengkap

#### b. `app/enroll-program/[programId]/page.tsx`
- Menambahkan validasi profil di fungsi `fetchProgramData()`
- Implementasi serupa dengan file di atas
- Mendukung referral code saat redirect

### 2. **File Baru yang Dibuat**

#### a. `lib/profileValidation.ts`
Helper function untuk validasi profil yang dapat digunakan kembali di berbagai komponen.

**Fungsi utama:**
- `validateProfileCompleteness(userId: string)` - Memeriksa kelengkapan profil user

**Field yang divalidasi:**
- Nama Lengkap
- Email
- Nomor Telepon
- Jenis Kelamin
- Alamat
- Provinsi
- Tanggal Lahir
- Pendidikan
- Status Pendidikan
- Status Pekerjaan
- Latar Belakang IT
- Status Disabilitas
- Sumber Informasi Program

#### b. `hooks/useProfileValidation.ts`
Custom React hook untuk memudahkan validasi profil dengan toast notification dan redirect otomatis.

**Penggunaan:**
```typescript
const { checkProfile } = useProfileValidation({
  returnUrl: '/programs/123/enroll',
  customMessage: 'Lengkapi profil untuk mendaftar',
  notificationDuration: 5000,
  redirectDelay: 1500
})

// Di dalam fungsi async
const isComplete = await checkProfile(userId)
if (!isComplete) return // User akan diarahkan ke halaman edit profil
```

### 3. **Halaman Edit Profil**

File `app/profile/edit/page.tsx` sudah ada dan berfungsi dengan baik untuk:
- Mengumpulkan semua data profil yang diperlukan
- Mendukung accordion untuk organisasi form yang lebih baik
- Menyimpan data ke `user_profiles` dan `participants`
- Mendukung parameter `return` untuk redirect setelah selesai

## Flow Diagram

```
User mencoba mendaftar program
         ↓
Sistem memeriksa kelengkapan profil
         ↓
    ┌─────────────────┐
    │ Profil Lengkap? │
    └─────────────────┘
         ↓          ↓
      Ya            Tidak
       ↓              ↓
  Lanjut ke      Tampilkan Toast
  pendaftaran    Notification
                     ↓
                Redirect ke
                /profile/edit
                     ↓
              User melengkapi
                   profil
                     ↓
               Simpan profil
                     ↓
            Kembali ke halaman
            pendaftaran program
```

## Cara Kerja

1. **Saat user mengakses halaman pendaftaran program:**
   - Sistem otomatis memeriksa kelengkapan profil
   - Jika belum lengkap, tampilkan notifikasi toast warning
   - Redirect ke `/profile/edit?return=/programs/{id}/enroll`

2. **Di halaman edit profil:**
   - User mengisi semua data yang diperlukan
   - Data disimpan ke database
   - Setelah berhasil, user di-redirect kembali ke halaman pendaftaran

3. **Kembali ke halaman pendaftaran:**
   - Validasi profil dijalankan lagi
   - Jika sudah lengkap, user dapat melanjutkan pendaftaran

## Testing Checklist

- [ ] User dengan profil lengkap dapat mendaftar program tanpa hambatan
- [ ] User dengan profil tidak lengkap melihat notifikasi toast
- [ ] User dengan profil tidak lengkap di-redirect ke halaman edit profil
- [ ] Setelah melengkapi profil, user kembali ke halaman pendaftaran
- [ ] Parameter `return` bekerja dengan benar
- [ ] Referral code tetap tersimpan setelah melengkapi profil
- [ ] Validasi berfungsi di semua halaman pendaftaran program

## Halaman yang Terpengaruh

✅ **Sudah Diimplementasikan:**
- `/programs/[id]/enroll` - Halaman pendaftaran program utama
- `/enroll-program/[programId]` - Halaman pendaftaran program alternatif

❌ **Tidak Perlu Implementasi:**
- `/enroll-program/[programId]/step1` - Halaman ini sudah mengumpulkan data profil
- `/register-referral/[code]` - Halaman ini sudah mengumpulkan data lengkap saat registrasi
- `/enrollments/new` - Halaman untuk admin/manager saja

## Penggunaan Hook (Opsional untuk Refactoring)

Untuk mengurangi duplikasi kode, developer dapat menggunakan hook `useProfileValidation`:

```typescript
import { useProfileValidation } from '@/hooks/useProfileValidation'

function MyEnrollmentPage() {
  const { checkProfile } = useProfileValidation({
    returnUrl: `/programs/${programId}/enroll`
  })

  useEffect(() => {
    async function validateUser() {
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser?.user?.id) {
        const isComplete = await checkProfile(authUser.user.id)
        if (!isComplete) return // User akan diarahkan otomatis
        
        // Lanjutkan fetch data program
        fetchProgram()
      }
    }
    validateUser()
  }, [])
}
```

## Database Schema

Validasi ini bergantung pada field-field berikut:

**Tabel `user_profiles`:**
- `full_name`
- `email`
- `phone`
- `gender`
- `address`
- `provinsi`

**Tabel `participants`:**
- `phone`
- `address`
- `gender`
- `date_of_birth`
- `education`
- `education_status`
- `employment_status`
- `it_background`
- `disability`
- `program_source`
- `provinsi`

## Catatan Penting

1. **Validasi dilakukan di client-side** - Untuk keamanan lebih baik, pertimbangkan untuk menambahkan validasi di server-side (API route atau Supabase RLS)

2. **Field yang diperlukan dapat dikonfigurasi** - Jika ada perubahan kebutuhan field, update di `lib/profileValidation.ts`

3. **Toast notification menggunakan Notification component** - Pastikan component ini sudah ter-setup dengan benar di aplikasi

4. **Return URL support** - Halaman edit profil mendukung parameter `return` untuk UX yang lebih baik

## Kontributor

Implementasi ini dibuat untuk memastikan kualitas data peserta program training.

