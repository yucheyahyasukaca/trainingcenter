# 🎓 Dashboard Trainer - GARUDA-21 Training Center

## 📋 Overview

Dashboard khusus untuk trainer yang memungkinkan mereka mengelola kelas yang ditugaskan, materi pelatihan, dan forum diskusi. Dashboard ini dirancang dengan desain modern yang konsisten dengan sistem yang sudah ada.

## 🚀 Fitur Utama

### 1. **Dashboard Utama** (`/trainer/dashboard`)
- **Statistik Trainer**: Total kelas, kelas aktif, kelas selesai, total peserta
- **Kelas Mendatang**: Preview kelas yang akan datang (maksimal 3)
- **Kelas Terbaru**: Riwayat kelas yang sudah selesai
- **Aksi Cepat**: Link ke fitur-fitur utama trainer
- **Profil Trainer**: Menampilkan level trainer dan informasi pribadi

### 2. **Manajemen Kelas** (`/trainer/classes`)
- **Daftar Kelas**: Semua kelas yang ditugaskan kepada trainer
- **Filter & Search**: Cari kelas berdasarkan nama atau program
- **Status Kelas**: Dijadwalkan, Berlangsung, Selesai, Dibatalkan
- **Aksi Kelas**: Lihat detail, kelola materi, forum diskusi
- **Buat Kelas Baru**: Form untuk membuat kelas baru

### 3. **Materi Pelatihan** (`/trainer/materials`)
- **Kelola Materi**: Akses ke materi untuk setiap kelas
- **Upload & Edit**: Upload dan edit materi pelatihan
- **Organisasi**: Materi terorganisir per kelas

### 4. **Forum Diskusi** (`/trainer/forum`)
- **Moderasi Forum**: Kelola diskusi untuk setiap kelas
- **Interaksi Peserta**: Berinteraksi dengan peserta pelatihan
- **Q&A**: Menjawab pertanyaan peserta

## 🎨 Desain & UI

### **Color Scheme**
- **Primary**: Blue gradient (blue-600 to blue-800)
- **Secondary**: Green, Purple, Orange untuk aksi
- **Background**: Gradient dari slate-50 via blue-50 to blue-100

### **Komponen Utama**
- **Cards**: Rounded-xl dengan shadow dan hover effects
- **Buttons**: Primary, secondary, dan action buttons
- **Icons**: Lucide React icons yang konsisten
- **Typography**: Font hierarchy yang jelas

### **Responsive Design**
- **Mobile**: Grid 1 kolom
- **Tablet**: Grid 2 kolom
- **Desktop**: Grid 3-4 kolom

## 📁 Struktur File

```
components/dashboard/
├── TrainerDashboard.tsx          # Dashboard utama trainer
└── TrainerProfile.tsx            # Komponen profil trainer

app/trainer/
├── dashboard/
│   └── page.tsx                  # Halaman dashboard trainer
├── classes/
│   ├── page.tsx                  # Daftar kelas trainer
│   └── new/
│       └── page.tsx              # Buat kelas baru
├── materials/
│   └── page.tsx                  # Materi pelatihan
└── forum/
    └── page.tsx                  # Forum diskusi
```

## 🔧 Integrasi Database

### **Tabel yang Digunakan**
- `user_profiles`: Data trainer dan role
- `trainers`: Data trainer terpisah
- `classes`: Data kelas
- `programs`: Data program
- `class_trainers`: Relasi trainer dengan kelas

### **Query Utama**
```sql
-- Fetch trainer classes
SELECT classes.*, programs.*, trainers.*
FROM classes
JOIN programs ON classes.program_id = programs.id
JOIN class_trainers ON classes.id = class_trainers.class_id
JOIN trainers ON class_trainers.trainer_id = trainers.id
WHERE trainers.user_id = $1
```

## 🎯 Role & Permission

### **Akses Trainer**
- Hanya user dengan `role = 'trainer'` yang bisa akses
- Otomatis redirect ke dashboard user jika bukan trainer
- Sidebar menampilkan menu khusus trainer

### **Menu Sidebar Trainer**
- Dashboard Trainer
- Kelas Saya
- Materi Pelatihan
- Forum Diskusi
- Profil Trainer
- Sertifikat

## 📊 Statistik & Metrics

### **Trainer Stats**
- **Total Kelas**: Jumlah kelas yang ditugaskan
- **Kelas Aktif**: Kelas yang sedang berlangsung
- **Kelas Selesai**: Kelas yang sudah selesai
- **Total Peserta**: Total peserta yang dilatih

### **Real-time Updates**
- Data diupdate otomatis saat ada perubahan
- Loading states untuk UX yang baik
- Error handling yang comprehensive

## 🚀 Cara Penggunaan

### **1. Akses Dashboard**
```typescript
// User dengan role 'trainer' otomatis diarahkan ke dashboard trainer
if (profile.role === 'trainer') {
  return <TrainerDashboard />
}
```

### **2. Buat Kelas Baru**
1. Klik "Buat Kelas Baru" di dashboard atau halaman kelas
2. Pilih program dari dropdown
3. Isi detail kelas (nama, deskripsi, tanggal, dll)
4. Submit form
5. Kelas otomatis ditugaskan ke trainer yang login

### **3. Kelola Materi**
1. Buka halaman "Materi Pelatihan"
2. Pilih kelas yang ingin dikelola
3. Klik "Kelola Materi"
4. Upload/edit materi pelatihan

### **4. Forum Diskusi**
1. Buka halaman "Forum Diskusi"
2. Pilih kelas yang ingin dimoderasi
3. Kelola thread dan reply peserta

## 🔄 Workflow Trainer

### **Daily Workflow**
1. **Login** → Dashboard trainer
2. **Check** → Kelas mendatang dan aktif
3. **Prepare** → Materi untuk kelas hari ini
4. **Moderate** → Forum diskusi peserta
5. **Update** → Status kelas jika selesai

### **Weekly Workflow**
1. **Review** → Performa kelas minggu ini
2. **Plan** → Kelas untuk minggu depan
3. **Create** → Kelas baru jika diperlukan
4. **Update** → Materi dan konten

## 🛠️ Customization

### **Menambah Fitur Baru**
1. Buat komponen di `components/dashboard/`
2. Buat halaman di `app/trainer/`
3. Update sidebar menu
4. Update routing

### **Mengubah Desain**
1. Edit CSS classes di komponen
2. Update color scheme di Tailwind
3. Modifikasi layout dan spacing

## 📱 Mobile Responsiveness

### **Breakpoints**
- **sm**: 640px (mobile landscape)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)

### **Mobile Features**
- Touch-friendly buttons
- Swipe gestures
- Optimized layouts
- Fast loading

## 🔐 Security

### **Authentication**
- Cek role trainer sebelum akses
- Redirect jika tidak authorized
- Session management

### **Data Protection**
- Hanya trainer yang bisa akses kelas mereka
- Validasi input form
- Error handling yang aman

## 🎉 Kesimpulan

Dashboard trainer memberikan interface yang lengkap dan user-friendly untuk trainer mengelola kelas mereka. Dengan desain yang modern, fitur yang comprehensive, dan integrasi database yang solid, trainer dapat fokus pada pengajaran tanpa terganggu oleh kompleksitas sistem.

**Key Benefits:**
- ✅ Interface yang intuitif dan modern
- ✅ Fitur lengkap untuk manajemen kelas
- ✅ Responsive design untuk semua device
- ✅ Integrasi database yang solid
- ✅ Role-based access control
- ✅ Real-time updates dan notifications
