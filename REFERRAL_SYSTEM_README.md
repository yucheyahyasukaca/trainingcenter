# 🎁 Sistem Referral Training Center

Sistem referral yang komprehensif untuk platform training center yang memungkinkan trainer untuk mendapatkan komisi dari setiap peserta yang mereka referensikan.

## ✨ Fitur Utama

- 🎯 **Kode Referral Unik** - Generate kode referral otomatis untuk setiap trainer
- 💰 **Sistem Komisi** - Komisi otomatis untuk setiap referral yang berhasil
- 🎁 **Diskon untuk Peserta** - Berikan diskon khusus kepada peserta yang menggunakan kode referral
- 📊 **Analytics Lengkap** - Dashboard statistik real-time untuk trainer
- 🔄 **Tracking Otomatis** - Tracking setiap penggunaan kode referral
- 🎨 **UI/UX Modern** - Interface yang user-friendly dan responsif

## 🚀 Quick Start

### 1. Database Setup

Jalankan migration script untuk menginstall sistem referral:

**Windows:**
```powershell
.\supabase\run-referral-migration.ps1
```

**Linux/Mac:**
```bash
./supabase/run-referral-migration.sh
```

### 2. Deploy Application

Sistem referral sudah terintegrasi dengan aplikasi utama. Pastikan semua file sudah di-deploy:

- ✅ API endpoints (`/api/referral/*`)
- ✅ UI components (`/components/referral/*`)
- ✅ Database schema (`create-referral-system.sql`)

### 3. Test Workflow

1. **Login sebagai trainer**
2. **Buka dashboard referral** (`/trainer/referral`)
3. **Buat kode referral baru**
4. **Test enrollment dengan kode referral**

## 📁 File Structure

```
├── supabase/
│   ├── create-referral-system.sql          # Database schema
│   ├── run-referral-migration.ps1          # Windows migration script
│   └── run-referral-migration.sh           # Linux/Mac migration script
├── app/
│   ├── api/referral/
│   │   ├── codes/route.ts                  # CRUD kode referral
│   │   ├── apply/route.ts                  # Apply kode referral
│   │   └── stats/route.ts                  # Statistik referral
│   └── trainer/referral/page.tsx           # Dashboard referral trainer
├── components/
│   └── referral/
│       ├── ReferralCodeInput.tsx           # Input kode referral
│       ├── ReferralDashboard.tsx           # Dashboard utama
│       └── ReferralCodeForm.tsx            # Form buat/edit kode
└── docs/
    ├── REFERRAL_SYSTEM_DOCUMENTATION.md    # Dokumentasi lengkap
    └── REFERRAL_SYSTEM_README.md           # File ini
```

## 🎯 Cara Penggunaan

### Untuk Trainer

1. **Buat Kode Referral**
   - Login ke dashboard trainer
   - Buka menu "Referral"
   - Klik "Buat Kode Referral"
   - Konfigurasi diskon dan komisi
   - Kode referral otomatis ter-generate

2. **Bagikan Kode Referral**
   - Copy link referral dari dashboard
   - Bagikan ke peserta potensial
   - Link format: `https://yoursite.com/programs?referral=TRN001`

3. **Monitor Statistik**
   - Lihat dashboard referral real-time
   - Track komisi yang didapat
   - Monitor performa per program

### Untuk Peserta

1. **Gunakan Kode Referral**
   - Buka halaman program
   - Masukkan kode referral (opsional)
   - Lihat preview harga setelah diskon
   - Lanjutkan enrollment

2. **Dapatkan Diskon**
   - Diskon otomatis diterapkan
   - Harga final ditampilkan jelas
   - Tidak ada biaya tambahan

## 🔧 Konfigurasi

### Database Functions

Sistem menggunakan beberapa database functions:

- `generate_referral_code()` - Generate kode unik
- `create_trainer_referral_code()` - Buat kode referral
- `apply_referral_code()` - Terapkan kode referral
- `track_referral_enrollment()` - Tracking enrollment
- `update_referral_status()` - Update status referral

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/referral/codes` | GET | Ambil daftar kode referral |
| `/api/referral/codes` | POST | Buat kode referral baru |
| `/api/referral/codes` | PUT | Update kode referral |
| `/api/referral/codes` | DELETE | Hapus kode referral |
| `/api/referral/apply` | GET | Validasi kode referral |
| `/api/referral/apply` | POST | Terapkan kode referral |
| `/api/referral/stats` | GET | Ambil statistik referral |

## 📊 Database Schema

### Tabel Utama

1. **`referral_codes`** - Kode referral trainer
2. **`referral_tracking`** - Tracking penggunaan kode
3. **`referral_rewards`** - Reward/komisi trainer

### Tabel yang Dimodifikasi

- **`enrollments`** - Ditambah field referral

## 🎨 UI Components

### ReferralCodeInput
Komponen input kode referral di halaman enrollment.

```tsx
<ReferralCodeInput
  programId={program.id}
  onReferralApplied={handleReferralApplied}
  onReferralRemoved={handleReferralRemoved}
  initialCode={referralCode}
/>
```

### ReferralDashboard
Dashboard lengkap untuk trainer.

```tsx
<ReferralDashboard />
```

## 🔒 Security

- **Row Level Security (RLS)** - Data terisolasi per user
- **Input Validation** - Validasi semua input
- **Rate Limiting** - Batasi request API
- **Audit Trail** - Log semua aktivitas

## 📈 Analytics

### Metrics yang Tersedia

- Total referral per trainer
- Conversion rate
- Total komisi earned
- Referral per program
- Trend bulanan
- Top performing codes

### Dashboard Features

- Real-time statistics
- Interactive charts
- Export data
- Filter by period
- Program comparison

## 🐛 Troubleshooting

### Common Issues

1. **Kode Referral Tidak Valid**
   - Cek status kode (aktif/nonaktif)
   - Cek masa berlaku
   - Cek batas penggunaan

2. **Komisi Tidak Muncul**
   - Cek status enrollment
   - Pastikan enrollment approved
   - Cek tracking function

3. **Dashboard Loading Lambat**
   - Cek database indexes
   - Implement pagination
   - Add caching

### Debug Mode

Aktifkan debug mode untuk melihat:
- Query logs
- Function execution
- Error details

## 🚀 Future Enhancements

- [ ] Email notifications
- [ ] Mobile app integration
- [ ] Advanced analytics
- [ ] Multi-level referral
- [ ] Payment integration
- [ ] QR code sharing

## 📞 Support

### Documentation
- [Full Documentation](REFERRAL_SYSTEM_DOCUMENTATION.md)
- [API Reference](REFERRAL_SYSTEM_DOCUMENTATION.md#api-endpoints)
- [Database Schema](REFERRAL_SYSTEM_DOCUMENTATION.md#database-schema)

### Contact
- Technical Support: tech@trainingcenter.com
- Feature Requests: features@trainingcenter.com
- Bug Reports: bugs@trainingcenter.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Changelog

### v1.0.0 (December 2024)
- ✅ Initial release
- ✅ Basic referral system
- ✅ Trainer dashboard
- ✅ Analytics and tracking
- ✅ Commission system

---

**Made with ❤️ by Training Center Development Team**
