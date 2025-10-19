# 🚀 Quick Start Guide

Panduan singkat untuk menjalankan Training Center Management System dalam 5 menit!

## Langkah Cepat

### 1️⃣ Install Dependencies (1 menit)
```bash
npm install
```

### 2️⃣ Setup Supabase (2 menit)

1. Buat akun gratis di [supabase.com](https://supabase.com)
2. Create new project
3. Copy Project URL & API Key dari Settings > API
4. Buat file `.env.local` dengan isi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3️⃣ Setup Database (2 menit)

1. Buka Supabase Dashboard > SQL Editor
2. **First:** Copy isi file `supabase/schema.sql`, Paste & Run
3. **Second:** Copy isi file `supabase/auth-setup.sql`, Paste & Run
4. ✅ Database ready dengan sample data!

### 3.5️⃣ Setup Sample Users (1 menit)

1. Di Supabase Dashboard, klik **Authentication** > **Users**
2. Klik **Add User** dan buat 3 users:
   - Email: `admin@trainingcenter.com`, Password: `admin123`, Auto Confirm: ON
   - Email: `manager@trainingcenter.com`, Password: `manager123`, Auto Confirm: ON  
   - Email: `user@trainingcenter.com`, Password: `user123`, Auto Confirm: ON
3. Update roles via SQL Editor:
```sql
UPDATE user_profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@trainingcenter.com';
UPDATE user_profiles SET role = 'manager', full_name = 'Manager User' WHERE email = 'manager@trainingcenter.com';
```
4. ✅ Users ready!

### 4️⃣ Run App (30 detik)
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5️⃣ Login! (10 detik)

1. Anda akan diarahkan ke halaman Login
2. **Quick Login:** Klik salah satu sample account
3. Atau masukkan email: `admin@trainingcenter.com`, password: `admin123`
4. Klik Login
5. 🎉 Selamat! Anda sudah masuk ke Dashboard!

## ✅ Checklist Setup

- [ ] Node.js installed (v18+)
- [ ] npm install completed
- [ ] Supabase account created
- [ ] `.env.local` file created with credentials
- [ ] Database schema executed (`schema.sql`)
- [ ] Auth schema executed (`auth-setup.sql`)
- [ ] Sample users created (admin, manager, user)
- [ ] User roles updated
- [ ] App running on localhost:3000
- [ ] Successfully login dengan admin account

## 🎯 Apa yang Bisa Dicoba?

### 🔐 Test Authentication:

1. **Login** dengan different accounts:
   - Admin (`admin@trainingcenter.com` / `admin123`)
   - Manager (`manager@trainingcenter.com` / `manager123`)
   - User (`user@trainingcenter.com` / `user123`)

2. **Logout** - Klik profile di header, pilih Logout

3. **Register** - Buat user baru via halaman register

### 📊 Dengan Sample Data yang Sudah Ada:

1. **Dashboard** - Lihat statistik overview
   - 3 trainer sudah terdaftar
   - 3 program aktif
   - 4 peserta
   - 4 pendaftaran

2. **Trainers** - Explore 3 trainer yang sudah ada
   - Dr. Budi Santoso (Leadership)
   - Siti Nurhaliza (Digital Marketing)
   - Ahmad Dahlan (Software Development)

3. **Programs** - 3 program siap jalan
   - Leadership Excellence Program
   - Digital Marketing Mastery
   - Full Stack Web Development

4. **Statistics** - Lihat charts & analytics

### ➕ Coba Tambah Data Baru:

1. ➕ Tambah Trainer Baru
2. ➕ Tambah Program Baru
3. ➕ Tambah Peserta Baru
4. ➕ Daftarkan Peserta ke Program

## 🎨 Screenshot Preview

```
┌─────────────────────────────────────┐
│  Training Center Management System │
├─────────────────────────────────────┤
│                                     │
│  📊 Dashboard dengan Stats Cards   │
│  📈 Interactive Charts              │
│  📋 Recent Enrollments Table        │
│                                     │
├─────────────────────────────────────┤
│  Sidebar Navigation:                │
│  • Dashboard                        │
│  • Program                          │
│  • Peserta                          │
│  • Trainer                          │
│  • Pendaftaran                      │
│  • Statistik                        │
└─────────────────────────────────────┘
```

## ❓ Troubleshooting

### Error: Cannot find module
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Invalid API key
- Pastikan `.env.local` sudah dibuat
- Check API key tidak ada spasi atau typo
- Restart dev server: `npm run dev`

### Database error
- Pastikan schema.sql sudah di-run
- Check di Supabase > Table Editor ada 4 tables
- Verify RLS policies enabled

### Port 3000 sudah digunakan
```bash
npm run dev -- -p 3001
# atau
PORT=3001 npm run dev
```

## 📚 Next Steps

1. Baca [SETUP.md](./SETUP.md) untuk panduan lengkap
2. Explore [FEATURES.md](./FEATURES.md) untuk detail fitur
3. Customize sesuai kebutuhan Anda!

## 💡 Tips

- **Authentication** - Semua routes protected, harus login dulu
- **Sample accounts** - Klik di login page untuk quick fill
- **Logout** - Klik profile di pojok kanan atas
- **Sample data** sudah include untuk testing
- **Search feature** available di semua list pages
- **Form validation** built-in
- **Responsive design** - coba di mobile!

## 🔐 Sample Login Credentials

```
Admin: admin@trainingcenter.com / admin123
Manager: manager@trainingcenter.com / manager123
User: user@trainingcenter.com / user123
```

## 🆘 Need Help?

- **Auth Issues?** Check [AUTH_SETUP.md](./AUTH_SETUP.md)
- **Setup Problems?** Check [SETUP.md](./SETUP.md)
- **Feature Guide:** Check [FEATURES.md](./FEATURES.md)
- Review [Supabase Docs](https://supabase.com/docs)
- Check [Next.js Docs](https://nextjs.org/docs)

---

**Happy Training Management! 🎓**

