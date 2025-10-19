# 🔐 Authentication Setup Guide

Panduan lengkap untuk mengaktifkan sistem authentication di Training Center Management System.

## 📋 Overview

Sistem authentication menggunakan **Supabase Auth** dengan fitur:
- ✅ Email/Password authentication
- ✅ User profiles dengan roles (Admin, Manager, User)
- ✅ Protected routes
- ✅ Login/Logout functionality
- ✅ User registration
- ✅ Auto-redirect untuk unauthorized users

---

## 🚀 Setup Authentication

### Step 1: Jalankan Auth Schema

Setelah menjalankan `schema.sql`, jalankan juga `auth-setup.sql`:

1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `supabase/auth-setup.sql`
3. Paste dan klik "Run"

File ini akan membuat:
- Table `user_profiles` untuk data profile user
- RLS policies untuk security
- Trigger untuk auto-create profile
- Indexes untuk performance

### Step 2: Buat Sample Users

Ada **2 cara** untuk membuat sample users:

#### **Cara 1: Via Supabase Dashboard (Recommended)**

1. Buka **Supabase Dashboard**
2. Klik **Authentication** di sidebar
3. Klik **Users** tab
4. Klik tombol **Add User**
5. Isi data user:
   - **Email:** `admin@trainingcenter.com`
   - **Password:** `admin123`
   - **Auto Confirm User:** ✅ ON (penting!)
   - **Send email confirmation:** ❌ OFF
6. Klik **Create User**
7. **Ulangi untuk semua sample users**

#### **Sample Users yang Perlu Dibuat:**

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| `admin@trainingcenter.com` | `admin123` | admin | Admin User |
| `manager@trainingcenter.com` | `manager123` | manager | Manager User |
| `user@trainingcenter.com` | `user123` | user | Regular User |

#### **Cara 2: Via Aplikasi (Register Page)**

1. Jalankan aplikasi: `npm run dev`
2. Buka `http://localhost:3000/register`
3. Isi form pendaftaran
4. User otomatis dibuat dengan role 'user'

### Step 3: Update User Roles

Setelah users dibuat, update role mereka via SQL:

```sql
-- Update role untuk admin
UPDATE user_profiles 
SET role = 'admin', full_name = 'Admin User' 
WHERE email = 'admin@trainingcenter.com';

-- Update role untuk manager
UPDATE user_profiles 
SET role = 'manager', full_name = 'Manager User' 
WHERE email = 'manager@trainingcenter.com';

-- Update role untuk user (sudah default, optional)
UPDATE user_profiles 
SET role = 'user', full_name = 'Regular User' 
WHERE email = 'user@trainingcenter.com';
```

Atau via Dashboard:
1. Authentication → Users
2. Klik user yang ingin diupdate
3. Scroll ke "Raw User Meta Data"
4. Update sesuai kebutuhan

### Step 4: Verify Setup

Cek apakah users sudah dibuat dengan benar:

```sql
-- Cek auth users
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Cek user profiles
SELECT id, email, full_name, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC;
```

---

## 🎯 Cara Menggunakan

### Login ke Aplikasi

1. Buka `http://localhost:3000`
2. Anda akan diarahkan ke `/login`
3. **Quick Login**: Klik salah satu sample account untuk auto-fill
4. Atau masukkan email/password manual
5. Klik **Login**
6. Anda akan diarahkan ke Dashboard

### Sample Login Credentials

```
👤 Admin Account
Email: admin@trainingcenter.com
Password: admin123
Role: Administrator

👤 Manager Account
Email: manager@trainingcenter.com
Password: manager123
Role: Manager

👤 User Account
Email: user@trainingcenter.com
Password: user123
Role: User
```

### Logout

1. Klik **user profile** di pojok kanan atas header
2. Dropdown menu akan muncul
3. Klik **Logout**
4. Anda akan diarahkan kembali ke halaman login

### Register User Baru

1. Dari halaman login, klik **"Daftar di sini"**
2. Isi form registrasi:
   - Nama Lengkap
   - Email
   - Password (min. 6 karakter)
   - Konfirmasi Password
3. Klik **Daftar Sekarang**
4. Setelah berhasil, anda diarahkan ke login
5. Login dengan credentials yang baru dibuat

---

## 🔒 User Roles & Permissions

### Role Hierarchy

1. **Admin** 
   - Full access ke semua fitur
   - Bisa manage trainers, programs, participants, enrollments
   - Akses statistik lengkap

2. **Manager**
   - Manage programs dan enrollments
   - View trainers dan participants
   - Akses statistik

3. **User**
   - View only untuk semua data
   - Bisa melihat programs dan statistik
   - Tidak bisa create/update/delete

### Default Permissions

Saat ini semua authenticated users punya **full access** untuk development.

Untuk **production**, uncomment RLS policies di `auth-setup.sql` untuk enable role-based restrictions.

---

## 🛡️ Security Features

### Protected Routes

Semua routes **kecuali** `/login` dan `/register` memerlukan authentication:

- `/` - Dashboard
- `/trainers` - Trainer management
- `/participants` - Participant management
- `/programs` - Program management
- `/enrollments` - Enrollment management
- `/statistics` - Statistics

**Auto-redirect:** Jika user belum login dan mencoba akses protected route, akan otomatis redirect ke `/login`.

### Middleware Protection

File `middleware.ts` menghandle route protection:
- Check authentication status
- Redirect unauthorized users ke login
- Redirect authenticated users dari login ke home

### Row Level Security (RLS)

RLS di Supabase memastikan:
- Users hanya bisa view own profile
- Admins bisa view all profiles
- Data protection di database level

---

## 🎨 UI Features

### Header dengan User Info

Header menampilkan:
- User full name
- User role badge (color-coded)
- Avatar placeholder
- Dropdown menu untuk logout

### Login Page

- Email/password form
- Quick-fill dengan sample accounts
- Error handling
- Loading states
- Link ke register page

### Register Page

- Full name, email, password fields
- Password confirmation
- Validation (min 6 chars)
- Success feedback
- Auto-redirect ke login

---

## 🔧 Troubleshooting

### Error: "Invalid login credentials"

**Solusi:**
- Pastikan email dan password benar
- Check CAPS LOCK
- Verify user sudah dibuat di Supabase Dashboard
- Pastikan user sudah confirmed (Auto Confirm ON)

### Error: "User already registered"

**Solusi:**
- Email sudah digunakan
- Gunakan email lain
- Atau login dengan email tersebut

### Users tidak bisa login

**Check:**
1. Apakah `auth-setup.sql` sudah dijalankan?
2. Apakah user sudah dibuat di Dashboard?
3. Apakah Auto Confirm User = ON?
4. Check table `auth.users` dan `user_profiles`

```sql
-- Verify users
SELECT * FROM auth.users;
SELECT * FROM user_profiles;
```

### Profile tidak muncul di Header

**Solusi:**
- Refresh browser
- Clear browser cache
- Check browser console untuk errors
- Verify `user_profiles` table exists

### Infinite redirect loop

**Solusi:**
- Clear browser cookies
- Logout completely
- Re-login dengan credentials yang benar

---

## 🔄 Development vs Production

### Development Mode (Current)

- ✅ All authenticated users have full access
- ✅ No role restrictions (untuk testing)
- ✅ Auto-confirm users
- ✅ No email verification

### Production Mode

Untuk production, aktifkan:

1. **Email Verification**
   ```sql
   -- In Supabase Dashboard → Authentication → Settings
   Enable Email Confirmations: ON
   ```

2. **Role-Based Access Control**
   - Uncomment RLS policies di `auth-setup.sql`
   - Test dengan different roles

3. **Environment Security**
   - Use proper password strength requirements
   - Enable 2FA (optional)
   - Rate limiting

---

## 📝 Code Examples

### Check if User is Authenticated

```typescript
import { isAuthenticated } from '@/lib/auth'

const isLoggedIn = await isAuthenticated()
if (!isLoggedIn) {
  router.push('/login')
}
```

### Check User Role

```typescript
import { hasRole } from '@/lib/auth'

// Check if admin
const isAdmin = await hasRole('admin')

// Check if manager or above
const isManager = await hasRole('manager')
```

### Get Current User

```typescript
import { getCurrentUser, getUserProfile } from '@/lib/auth'

const user = await getCurrentUser()
if (user) {
  const profile = await getUserProfile(user.id)
  console.log(profile.role) // 'admin', 'manager', or 'user'
}
```

### Sign In

```typescript
import { signIn } from '@/lib/auth'

try {
  await signIn('user@example.com', 'password123')
  router.push('/')
} catch (error) {
  console.error('Login failed:', error)
}
```

### Sign Out

```typescript
import { signOut } from '@/lib/auth'

try {
  await signOut()
  router.push('/login')
} catch (error) {
  console.error('Logout failed:', error)
}
```

---

## 📊 Database Schema

### `user_profiles` Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID (references auth.users) |
| `email` | VARCHAR | User email |
| `full_name` | VARCHAR | User's full name |
| `role` | VARCHAR | User role (admin/manager/user) |
| `avatar_url` | TEXT | Profile picture URL (optional) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## ✅ Checklist Setup

- [ ] Jalankan `supabase/schema.sql`
- [ ] Jalankan `supabase/auth-setup.sql`
- [ ] Buat 3 sample users di Dashboard
- [ ] Update roles via SQL
- [ ] Verify users di table `auth.users`
- [ ] Verify profiles di table `user_profiles`
- [ ] Test login dengan admin account
- [ ] Test login dengan manager account
- [ ] Test login dengan user account
- [ ] Test logout functionality
- [ ] Test register new user
- [ ] Test protected routes redirect

---

## 🎉 Selesai!

Authentication system sudah siap digunakan!

### Next Steps:

1. ✅ Login dengan sample accounts
2. ✅ Explore aplikasi dengan different roles
3. ✅ Test logout/login functionality
4. ✅ Register new users
5. ✅ Customize sesuai kebutuhan

---

**Need Help?** Check troubleshooting section atau baca dokumentasi Supabase Auth di [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)

