# Fix Enrollment Access Issue

## Problem
1. User `yucheyahya@gmail.com` tidak bisa akses kelas setelah mendaftar
2. Tombol "Daftar" tidak berubah menjadi "Terdaftar" di halaman `/programs`

## Root Cause
- User tidak memiliki record di tabel `participants`
- Atau record `participants` tidak terhubung dengan `auth.users` via `user_id`
- RLS (Row Level Security) policies tidak memungkinkan user melihat enrollments mereka

## Solution

### Step 1: Run SQL Script
Buka Supabase Dashboard → SQL Editor → New Query

Copy dan paste isi file `supabase/FIX_USER_ENROLLMENT_ACCESS_V2.sql`, lalu jalankan.

Script ini akan:
1. Menambahkan kolom `user_id` ke tabel `participants` jika belum ada
2. Menambahkan kolom `status`, `company`, `position` jika belum ada
3. Menghubungkan `participants` dengan `auth.users` berdasarkan email
4. Membuat record `participants` untuk semua user yang belum punya
5. Memperbaiki RLS policies untuk `enrollments`
6. Membuat index untuk performa

### Step 2: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 3: Test
1. Login sebagai `yucheyahya@gmail.com`
2. Buka browser console (F12)
3. Check logs untuk:
   - "Participant lookup:" - harusnya berhasil menemukan participant
   - "Enrollments query result:" - harusnya mengembalikan enrollment data
4. Navigate to `/programs` - tombol harus berubah menjadi "Terdaftar"
5. Navigate to kelas program - harus bisa akses kelas

## Verification

### Check Database
```sql
-- Check if user has participant record
SELECT p.*, au.email 
FROM participants p
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'yucheyahya@gmail.com';

-- Check enrollments
SELECT e.*, p.user_id, p.email
FROM enrollments e
JOIN participants p ON e.participant_id = p.id
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'yucheyahya@gmail.com';
```

### Expected Results
- User `yucheyahya@gmail.com` memiliki record di `participants` dengan `user_id` terisi
- Enrollment record exists untuk user tersebut
- RLS policies allow user to view their enrollments

## Troubleshooting

### If still can't access classes:
1. Check browser console for errors
2. Check Supabase logs for RLS policy violations
3. Verify that `participant_id` in `enrollments` matches the `id` in `participants`
4. Check that enrollment `status` is `approved`

### If "Daftar" button doesn't change to "Terdaftar":
1. Hard refresh the page (Ctrl+Shift+R)
2. Check browser console for enrollment data
3. Check if `enrollmentMap` is being set correctly
4. Verify that `fetchUserEnrollments` is being called

## Notes
- Script ini aman untuk dijalankan multiple times (idempotent)
- Script menggunakan `IF NOT EXISTS` untuk mencegah error
- Script akan mencetak summary di akhir execution
