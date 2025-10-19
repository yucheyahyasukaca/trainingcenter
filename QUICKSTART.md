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

### 3️⃣ Setup Database (1 menit)

1. Buka Supabase Dashboard > SQL Editor
2. Copy isi file `supabase/schema.sql`
3. Paste & Run
4. ✅ Database ready dengan sample data!

### 4️⃣ Run App (30 detik)
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🎉

## ✅ Checklist Setup

- [ ] Node.js installed (v18+)
- [ ] npm install completed
- [ ] Supabase account created
- [ ] `.env.local` file created with credentials
- [ ] Database schema executed
- [ ] App running on localhost:3000

## 🎯 Apa yang Bisa Dicoba?

### Dengan Sample Data yang Sudah Ada:

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

### Coba Tambah Data Baru:

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

- **Sample data** sudah include untuk testing
- **Search feature** available di semua list pages
- **Form validation** built-in
- **Responsive design** - coba di mobile!

## 🆘 Need Help?

- Check [SETUP.md](./SETUP.md) untuk troubleshooting detail
- Review [Supabase Docs](https://supabase.com/docs)
- Check [Next.js Docs](https://nextjs.org/docs)

---

**Happy Training Management! 🎓**

