# 🎓 Training Center Management System

> Aplikasi modern dan scalable untuk manajemen training center dengan fitur lengkap untuk pendaftaran trainer, peserta, dan statistik kegiatan.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

## ✨ Fitur Utama

### 🎯 Manajemen Lengkap
- 📚 **Manajemen Trainer** - Pendaftaran dan pendataan trainer/instruktur
- 👥 **Manajemen Peserta** - Pendaftaran dan pendataan peserta kegiatan
- 🎓 **Manajemen Program** - Kelola berbagai program pelatihan
- 📝 **Manajemen Pendaftaran** - Tracking enrollment dan pembayaran

### 📊 Analytics & Reporting
- 📈 **Dashboard Interaktif** - Real-time statistics dan overview
- 📊 **Statistik Detail** - Analytics per program, kategori, dan trainer
- 💰 **Revenue Tracking** - Monitoring pendapatan per program
- 📉 **Trend Analysis** - Grafik tren pendaftaran bulanan

### 🎨 User Experience
- 🌐 **Modern UI/UX** - Interface yang clean dan intuitif
- 📱 **Fully Responsive** - Optimal di mobile, tablet, dan desktop
- ⚡ **Fast & Scalable** - Built dengan Next.js 14 dan Supabase
- 🔍 **Search & Filter** - Pencarian cepat di semua modul

## 🚀 Quick Start

### Prasyarat
- Node.js 18+ 
- npm atau yarn
- Akun Supabase (gratis)

### Install & Run dalam 5 Menit

```bash
# 1. Clone repository
git clone <your-repo-url>
cd trainingcenter

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dengan Supabase credentials Anda

# 4. Run development server
npm run dev
```

📖 **Panduan Lengkap:** Lihat [QUICKSTART.md](./QUICKSTART.md) atau [SETUP.md](./SETUP.md)

## 🏗️ Tech Stack

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) - React framework dengan App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Charts:** [Recharts](https://recharts.org/) - Composable charting library
- **Icons:** [Lucide React](https://lucide.dev/) - Beautiful & consistent icons

### Backend
- **Database:** [Supabase](https://supabase.com/) - PostgreSQL database
- **Auth:** Supabase Auth (ready untuk implementasi)
- **Storage:** Supabase Storage (ready untuk file uploads)
- **Real-time:** Supabase Realtime (optional)

### Development
- **Package Manager:** npm
- **Linting:** ESLint
- **Code Formatting:** Prettier (recommended)
- **Version Control:** Git

## 📁 Struktur Project

```
trainingcenter/
├── 📂 app/                    # Next.js App Router pages
│   ├── trainers/              # Trainer management
│   ├── participants/          # Participant management
│   ├── programs/              # Program management
│   ├── enrollments/           # Enrollment management
│   ├── statistics/            # Statistics & analytics
│   └── layout.tsx             # Root layout
│
├── 📂 components/             # React components
│   ├── dashboard/             # Dashboard components
│   ├── layout/                # Layout components
│   └── statistics/            # Statistics components
│
├── 📂 lib/                    # Utilities & configs
│   ├── supabase.ts            # Supabase client
│   └── utils.ts               # Helper functions
│
├── 📂 types/                  # TypeScript types
│   ├── database.ts            # Database types
│   └── index.ts               # Custom types
│
├── 📂 supabase/               # Database schemas
│   └── schema.sql             # SQL schema & sample data
│
└── 📄 Config files
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

📖 **Detail Lengkap:** Lihat [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `trainers` | Data trainer/instruktur |
| `programs` | Data program/kegiatan training |
| `participants` | Data peserta training |
| `enrollments` | Data pendaftaran peserta ke program |

### Relations

```
trainers ──< programs >──< enrollments >── participants
```

📖 **Schema Lengkap:** Lihat `supabase/schema.sql`

## 🎯 Fitur Detail

### 1️⃣ Dashboard
- Overview statistik (total programs, participants, trainers, enrollments)
- Chart distribusi program per kategori
- Chart status pendaftaran
- Tabel 5 pendaftaran terbaru

### 2️⃣ Manajemen Trainer
- CRUD trainer (Create, Read, Update, Delete)
- Data: nama, email, phone, spesialisasi, pengalaman, sertifikasi
- Search & filter
- Status management (active/inactive)

### 3️⃣ Manajemen Peserta  
- CRUD peserta
- Data lengkap: pribadi, kontak, perusahaan, posisi
- Gender & tanggal lahir
- Alamat lengkap

### 4️⃣ Manajemen Program
- CRUD program training
- Info: judul, deskripsi, kategori, durasi, kapasitas
- Pricing & scheduling
- Assign trainer
- Status (draft/published/archived)

### 5️⃣ Manajemen Pendaftaran
- Daftarkan peserta ke program
- Status tracking (pending/approved/rejected/completed)
- Payment tracking (unpaid/partial/paid)
- Amount tracking
- Notes per enrollment

### 6️⃣ Statistik & Analytics
- Comprehensive dashboard
- Tren pendaftaran bulanan (line chart)
- Performa trainer
- Revenue per program
- Multiple visualizations

📖 **Detail Semua Fitur:** Lihat [FEATURES.md](./FEATURES.md)

## 🔌 API Reference

Aplikasi menggunakan Supabase client untuk database operations. 

**Contoh Query:**

```typescript
// Get all trainers
const { data, error } = await supabase
  .from('trainers')
  .select('*')
  .order('created_at', { ascending: false })

// Get programs with trainer info
const { data, error } = await supabase
  .from('programs')
  .select(`
    *,
    trainer:trainers(name, specialization)
  `)
```

📖 **API Lengkap:** Lihat [API_REFERENCE.md](./API_REFERENCE.md)

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy!

### Platform Lain
- Netlify
- Railway  
- Render
- AWS Amplify

📖 **Deployment Guide:** Lihat [SETUP.md](./SETUP.md#production-deployment)

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔐 Environment Variables

Buat file `.env.local` dengan:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🤝 Contributing

Contributions are welcome! Silakan:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

## 📞 Support

Jika ada pertanyaan atau butuh bantuan:

- 📖 Baca dokumentasi di folder root
- 🐛 Report bugs via GitHub Issues
- 💡 Request features via GitHub Issues

---

**Built with ❤️ using Next.js and Supabase**

